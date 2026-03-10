'use client';

import { useEffect, useState } from 'react';
import { useGameEngine } from '@/features/basket-game/model/useGameEngine';
import { useMatchLogic } from '@/features/basket-game/model/useMatchLogic';
import GameCanvas from '@/features/basket-game/ui/GameCanvas';
import GameHUD from '@/features/basket-game/ui/GameHUD';
import { LEVELS } from '@/features/basket-game/config/levels';
import styles from './page.module.scss';

export default function GamePage() {
  const [levelId, setLevelId] = useState(1);
  const currentLevel = LEVELS.find((l) => l.id === levelId) || LEVELS[0];

  const {
    canvasRef, // Note: canvasRef from useGameEngine is for sizing/physics, but GameCanvas has its own ref? 
    // Actually useGameEngine needs the canvas dimensions. 
    // In my useGameEngine implementation, it uses canvasRef.current to get width/height.
    // So GameCanvas should forward its ref? 
    // Or simpler: GameCanvas renders the canvas and passes the ref to parent, which passes to useGameEngine.
    // But GameCanvas uses the ref for drawing context.
    // Let's make GameCanvas forwardRef or just expose it.
    // Actually, useGameEngine just needs width/height.
    // I can pass width/height to useGameEngine initGame.
    gameState,
    vegetablesRef,
    particlesRef,
    initGame,
    destroyChain,
    activateBooster,
  } = useGameEngine(currentLevel);

  const { handlers, chainLineRef } = useMatchLogic(
    vegetablesRef.current, // Map is mutable, passing ref.current is fine for initial, but useMatchLogic needs live map?
    // useMatchLogic uses `vegetables` in callbacks. If I pass `vegetablesRef.current` (the Map object), it works as long as the Map instance doesn't change.
    // useGameEngine clears map but doesn't replace the Map instance?
    // In useGameEngine: `vegetablesRef.current = new Map()`? No, `vegetablesRef.current.clear()`.
    // So the Map instance is stable.
    destroyChain
  );

  // Initialize game on mount
  useEffect(() => {
    // We need to wait for canvas to be mounted?
    // useGameEngine.initGame checks canvasRef.current.
    // So we need to pass the canvas ref from GameCanvas to useGameEngine.
    // But GameCanvas has its own ref.
    // Let's modify GameCanvas to accept a ref or use callback ref.
    // Or just start initGame with fixed dimensions for now.
    
    // Actually, useGameEngine uses canvasRef just for width/height.
    // I can pass a mock or wait.
    
    // Let's just run initGame after a small delay or use a ref callback.
    const timer = setTimeout(() => {
        initGame();
    }, 100);
    return () => clearTimeout(timer);
  }, [initGame, levelId]);

  return (
    <div className={styles.gameContainer}>
      <GameHUD gameState={gameState} onBoosterClick={activateBooster} />
      
      <GameCanvas
        canvasRef={canvasRef}
        vegetablesRef={vegetablesRef}
        particlesRef={particlesRef}
        chainLineRef={chainLineRef}
        width={360} // Fixed width for now, or dynamic
        height={640}
        onPointerDown={handlers.handlePointerDown}
        onPointerMove={handlers.handlePointerMove}
        onPointerUp={handlers.handlePointerUp}
      />
      
      {/* Overlay logic for modals would go here */}
      {gameState.status === 'win' && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Victory!</h2>
            <p>Score: {gameState.score}</p>
            <button onClick={() => setLevelId(levelId + 1)}>Next Level</button>
          </div>
        </div>
      )}
      
       {gameState.status === 'lose_moves' && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Out of Moves!</h2>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      )}
    </div>
  );
}
