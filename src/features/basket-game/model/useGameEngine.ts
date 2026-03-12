import { useRef, useCallback, useEffect } from 'react';
import Matter from 'matter-js';
import type { LevelConfig } from '../config/levels';
import type { GameItem, GameStatus } from './types';
import { ITEM_CONFIGS } from '../config/items';
import { STONE_CONFIGS, NET_PROGRESSION } from '../config/blockers';
import { initPhysicsEngine, createBasketBodies } from '../lib/physics';
import { calculateChainScore, calculateHarvestProgress } from '../lib/scoreCalc';
import { spawnMatchEffect, updateParticles } from '../lib/effectsCanvas';
import { useGameStore } from './useGameStore';
import { useSpawner } from './useSpawner';
import { useBoosterLogic } from './useBoosterLogic';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { BASKET_BOTTOM_Y, BASKET_TOP_Y, getBasketInnerBoundsAtY } from '../lib/basket';

export function useGameEngine(levelConfig: LevelConfig) {
  const itemsRef = useRef<Map<string, GameItem>>(new Map());
  const engineRef = useRef<Matter.Engine | null>(null);
  const rafRef = useRef<number>(0);

  const { spawnInitialItems, respawnAfterMatch, spawnStone } = useSpawner(
    levelConfig,
    engineRef,
    itemsRef,
  );

  const { activateBoosterMode, cancelBooster, applyBooster } = useBoosterLogic(
    engineRef,
    itemsRef,
    respawnAfterMatch,
  );

  // ─── GAME LOOP ───────────────────────────────────────────────────────
  // Only physics + particles. No continuous item spawning.
  const gameLoop = useCallback(() => {
    const { status } = useGameStore.getState();
    if (status !== 'playing' && status !== 'booster_mode') return;
    if (!engineRef.current) return;

    Matter.Engine.update(engineRef.current, 1000 / 60);
    updateParticles();

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const getRandomPointInBasket = useCallback((radius: number, minY: number, maxY: number) => {
    const safeMinY = Math.max(BASKET_TOP_Y + radius, minY);
    const safeMaxY = Math.min(BASKET_BOTTOM_Y - radius, maxY);
    const y = safeMinY + Math.random() * Math.max(0, safeMaxY - safeMinY);
    const bounds = getBasketInnerBoundsAtY(y, radius + 8);
    const width = Math.max(0, bounds.right - bounds.left);

    return {
      x: bounds.left + (width > 0 ? Math.random() * width : 0),
      y,
    };
  }, []);

  // ─── INIT ─────────────────────────────────────────────────────────────
  const initGame = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (engineRef.current) Matter.Engine.clear(engineRef.current);
    itemsRef.current.clear();

    const { engine } = initPhysicsEngine({
      canvasWidth: GAME_WIDTH,
      canvasHeight: GAME_HEIGHT,
      gravity: 1.5,
    });
    engineRef.current = engine;

    // Basket
    const basket = createBasketBodies(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    Matter.World.add(engine.world, basket);

    // Ground below visible area
    const ground = Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 50, GAME_WIDTH * 2, 100, {
      isStatic: true,
      label: 'ground',
    });
    Matter.World.add(engine.world, ground);

    let placedCount = 0;

    // Preset items
    for (const preset of levelConfig.presetItems) {
      const baseType = preset.type.startsWith('golden_')
        ? (preset.type.slice(7) as import('./types').ItemType)
        : (preset.type as import('./types').ItemType);
      const cfg = ITEM_CONFIGS[baseType];
      for (let i = 0; i < preset.count; i++) {
        const point = getRandomPointInBasket(
          cfg.radius,
          GAME_HEIGHT * 0.34,
          GAME_HEIGHT * 0.72,
        );
        const x = point.x;
        const y = point.y;
        const body = Matter.Bodies.circle(x, y, cfg.radius, {
          restitution: cfg.restitution,
          friction: cfg.friction,
          frictionAir: cfg.frictionAir,
          mass: cfg.mass,
          label: 'item',
        });
        const isGolden = preset.type.startsWith('golden_');
        const item: GameItem = {
          id: String(body.id),
          body,
          type: preset.type,
          netState: null,
          stoneSize: null,
          stoneHitsLeft: 0,
          isGolden,
          isSelected: false,
        };
        Matter.World.add(engine.world, body);
        itemsRef.current.set(item.id, item);
        placedCount++;
      }
    }

    // Net blockers
    for (const nb of levelConfig.netBlockers) {
      const cfg = ITEM_CONFIGS[nb.wrapsType];
      for (let i = 0; i < nb.count; i++) {
        const point = getRandomPointInBasket(
          cfg.radius,
          GAME_HEIGHT * 0.4,
          GAME_HEIGHT * 0.75,
        );
        const x = point.x;
        const y = point.y;
        const body = Matter.Bodies.circle(x, y, cfg.radius, {
          restitution: cfg.restitution,
          friction: cfg.friction,
          frictionAir: cfg.frictionAir,
          mass: cfg.mass,
          label: 'item',
        });
        const item: GameItem = {
          id: String(body.id),
          body,
          type: nb.wrapsType,
          netState: nb.initialState,
          stoneSize: null,
          stoneHitsLeft: 0,
          isGolden: false,
          isSelected: false,
        };
        Matter.World.add(engine.world, body);
        itemsRef.current.set(item.id, item);
        placedCount++;
      }
    }

    // Stone blockers
    for (const sb of levelConfig.stoneBlockers) {
      const stoneCfg = STONE_CONFIGS[sb.size];
      for (let i = 0; i < sb.count; i++) {
        const point = getRandomPointInBasket(
          stoneCfg.radius,
          GAME_HEIGHT * 0.48,
          GAME_HEIGHT * 0.78,
        );
        const x = point.x;
        const y = point.y;
        spawnStone(sb.size, x, y);
        placedCount++;
      }
    }

    // Fill remaining slots with random items
    spawnInitialItems(placedCount);

    useGameStore.getState().resetGame({
      levelId: levelConfig.id,
      movesLimit: levelConfig.movesLimit,
      harvestGoalPoints: levelConfig.harvestGoalPoints,
      startBoosters: levelConfig.startBoosters,
    });
    useGameStore.getState().setStatus('playing');

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [getRandomPointInBasket, levelConfig, gameLoop, spawnInitialItems, spawnStone]);

  // ─── DESTROY CHAIN ────────────────────────────────────────────────────
  const destroyChain = useCallback(
    (chain: GameItem[]) => {
      if (!engineRef.current) return;

      const store = useGameStore.getState();
      const score = calculateChainScore(chain);
      const progressPct = calculateHarvestProgress(score, store.harvestGoal);

      // Remove chain items
      for (const item of chain) {
        Matter.World.remove(engineRef.current.world, item.body);
        itemsRef.current.delete(item.id);
      }

      spawnMatchEffect(chain);

      // Degrade nets and stones near chain
      for (const chainItem of chain) {
        const cr = chainItem.body.circleRadius ?? 0;
        for (const mapItem of itemsRef.current.values()) {
          const mr = mapItem.body.circleRadius ?? 0;
          const dx = chainItem.body.position.x - mapItem.body.position.x;
          const dy = chainItem.body.position.y - mapItem.body.position.y;
          const inRange = Math.sqrt(dx * dx + dy * dy) <= cr + mr + 35;
          if (!inRange) continue;

          if (mapItem.netState !== null) {
            mapItem.netState = NET_PROGRESSION[mapItem.netState];
          }

          if (mapItem.stoneSize !== null) {
            mapItem.stoneHitsLeft -= 1;
            if (mapItem.stoneHitsLeft <= 0) {
              Matter.World.remove(engineRef.current!.world, mapItem.body);
              itemsRef.current.delete(mapItem.id);
            }
          }
        }
      }

      // Respawn exactly the number of removed items
      respawnAfterMatch(chain.length);

      useGameStore.getState().addScore(score);
      useGameStore.getState().addProgress(progressPct);
      useGameStore.getState().decrementMoves();
      useGameStore.getState().setChain([]);

      const next = useGameStore.getState();
      const newStatus: GameStatus =
        next.harvestProgress >= 100 ? 'win' : next.movesLeft <= 0 ? 'lose' : 'playing';
      if (newStatus !== 'playing') {
        useGameStore.getState().setStatus(newStatus);
      }
    },
    [respawnAfterMatch],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, []);

  return { itemsRef, initGame, destroyChain, activateBoosterMode, cancelBooster, applyBooster };
}
