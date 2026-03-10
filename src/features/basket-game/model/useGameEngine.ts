import { useState, useRef, useCallback, useEffect } from 'react';
import Matter from 'matter-js';
import { LevelConfig } from '../config/levels';
import { GameState, VegetableBody, BoosterType, EffectParticle } from './types';
import { initPhysicsEngine, createBasketBodies } from '../lib/physics';
import { VEGETABLE_CONFIGS, VegetableType } from '../config/vegetables';
import { calculateChainScore } from '../lib/matchUtils';
import { spawnMatchEffect, updateParticles } from '../lib/effectsCanvas';

export function useGameEngine(levelConfig: LevelConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const vegetablesRef = useRef<Map<string, VegetableBody>>(new Map());
  const particlesRef = useRef<EffectParticle[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    movesLeft: levelConfig.movesLimit,
    harvestProgress: 0,
    harvestGoal: levelConfig.harvestGoal,
    currentChain: [],
    boosters: {
      blender: 0,
      skewer: 0,
      watering: 0,
      rake: 0,
      secateur: 0,
      extraMoves: 0,
      ...levelConfig.startBoosters,
    } as any, // Cast because Partial<BoosterInventory> vs BoosterInventory
    seedPackets: 0,
  });

  // ─── SPAWN ───
  const spawnVegetable = useCallback(() => {
    if (!engineRef.current) return;

    // Check max vegetables limit
    if (vegetablesRef.current.size >= levelConfig.maxVegetables) return;

    // Determine type based on weights
    const rand = Math.random();
    // Simple weighted random selection
    const types = levelConfig.vegetableTypes;
    // For now, just random pick
    const type = types[Math.floor(Math.random() * types.length)];

    // Check golden chance
    const isGolden = Math.random() < levelConfig.goldenChance;
    let finalType = type;
    if (isGolden) {
      const goldenName = `golden_${type}`;
      // Check if specific golden config exists
      if (VEGETABLE_CONFIGS[goldenName as VegetableType]) {
        finalType = goldenName as VegetableType;
      }
    }

    // Check if golden version exists, otherwise use base type
    const config = VEGETABLE_CONFIGS[finalType];

    const x = Math.random() * (config.radius * 2) + config.radius; // Simplified spawn X
    // Actually should be within basket width
    // Assuming basket is centered at canvasWidth / 2
    // We need canvas dimensions.
    // Let's assume standard mobile width for now or get from config.
    const canvasWidth = canvasRef.current?.width || 360;
    const spawnX = Math.random() * (canvasWidth - 100) + 50;

    const body = Matter.Bodies.circle(spawnX, -50, config.radius, {
      restitution: config.restitution,
      friction: config.friction,
      frictionAir: config.frictionAir,
      mass: config.mass,
      label: 'vegetable',
    });

    const vegBody: VegetableBody = {
      id: body.id.toString(),
      matterBody: body,
      type: finalType,
      blockerState: 'none',
      isSelected: false,
      isFrozen: false,
      isGolden: isGolden,
      frozenTurnsLeft: 0,
    };

    Matter.World.add(engineRef.current.world, body);
    vegetablesRef.current.set(vegBody.id, vegBody);
  }, [levelConfig]);

  // ─── GAME LOOP ───
  const gameLoop = useCallback(() => {
    if (!engineRef.current || !canvasRef.current) return;

    Matter.Engine.update(engineRef.current, 1000 / 60);

    // Spawn logic
    const now = Date.now();
    // Logic changed: spawn until max is reached, then only spawn to replace
    // Initial fill or refill
    if (gameState.status === 'playing') {
      if (vegetablesRef.current.size < levelConfig.maxVegetables) {
        // If we are below max, spawn rapidly or immediately
        // Let's keep a small interval to avoid physics explosion
        if (now - lastSpawnTimeRef.current > 100) {
          // Fast spawn for refill
          spawnVegetable();
          lastSpawnTimeRef.current = now;
        }
      }
    }

    // Update particles
    particlesRef.current = updateParticles(particlesRef.current);

    // Check overflow
    // checkOverflowLine();

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.status, levelConfig.spawnInterval, spawnVegetable]);

  // ─── INITIALIZATION ───
  const initGame = useCallback(() => {
    if (!canvasRef.current) return;

    const { width, height } = canvasRef.current;
    const { engine, runner } = initPhysicsEngine({
      canvasWidth: width,
      canvasHeight: height,
      gravity: 1.5,
    });

    engineRef.current = engine;
    runnerRef.current = runner;
    vegetablesRef.current.clear();
    particlesRef.current = [];

    // Create Basket
    const basketWidth = width - 40;
    const basketHeight = 400; // Increased height
    // Position the center such that the bottom is near the bottom of the canvas
    const basketY = height - basketHeight / 2 - 10;

    const basket = createBasketBodies(
      width / 2,
      basketY,
      basketWidth,
      basketHeight,
    );
    Matter.World.add(engine.world, basket);

    setGameState((prev) => ({ ...prev, status: 'playing' }));
    lastSpawnTimeRef.current = Date.now();

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ─── DESTROY CHAIN ───
  const destroyChain = useCallback((chain: VegetableBody[]) => {
    if (!engineRef.current) return;

    const score = calculateChainScore(chain);

    // Remove bodies
    chain.forEach((v) => {
      Matter.World.remove(engineRef.current!.world, v.matterBody);
      vegetablesRef.current.delete(v.id);
    });

    // Spawn effects
    particlesRef.current = spawnMatchEffect(particlesRef.current, chain);

    setGameState((prev) => {
      const newScore = prev.score + score;
      const newMoves = prev.movesLeft - 1;
      const progressGain = score; // Using score directly as progress
      const newProgress = prev.harvestProgress + progressGain;

      let status = prev.status;
      if (newProgress >= prev.harvestGoal) status = 'win';
      else if (newMoves <= 0) status = 'lose_moves';

      return {
        ...prev,
        score: newScore,
        movesLeft: newMoves,
        harvestProgress: newProgress,
        status,
      };
    });
  }, []);

  const activateBooster = useCallback(
    (type: BoosterType, targetVegetableId?: string) => {
      if (!engineRef.current) return;

      // Check if booster is available
      if (gameState.boosters[type] <= 0) return;

      let success = false;

      switch (type) {
        case 'rake': {
          // Apply random force to all vegetables
          vegetablesRef.current.forEach((veg) => {
            Matter.Body.applyForce(veg.matterBody, veg.matterBody.position, {
              x: (Math.random() - 0.5) * 0.05,
              y: -(Math.random() * 0.05),
            });
          });
          success = true;
          break;
        }
        case 'extraMoves': {
          setGameState((prev) => ({ ...prev, movesLeft: prev.movesLeft + 5 }));
          success = true;
          break;
        }
        // Implement other boosters here
      }

      if (success) {
        setGameState((prev) => ({
          ...prev,
          boosters: {
            ...prev.boosters,
            [type]: prev.boosters[type] - 1,
          },
        }));
      }
    },
    [gameState.boosters],
  );

  const resetLevel = useCallback(() => {
    setGameState({
      status: 'idle',
      score: 0,
      movesLeft: levelConfig.movesLimit,
      harvestProgress: 0,
      harvestGoal: levelConfig.harvestGoal,
      currentChain: [],
      boosters: { ...levelConfig.startBoosters } as any,
      seedPackets: 0,
    });
    initGame();
  }, [levelConfig, initGame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, []);

  return {
    canvasRef,
    gameState,
    vegetablesRef, // Need to expose this for hit testing in UI/hooks
    particlesRef,
    initGame,
    destroyChain,
    activateBooster,
    resetLevel,
  };
}
