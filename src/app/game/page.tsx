'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameEngine } from '@/features/basket-game/model/useGameEngine';
import { useMatchLogic } from '@/features/basket-game/model/useMatchLogic';
import { useGameStore } from '@/features/basket-game/model/useGameStore';
import GameCanvas from '@/features/basket-game/ui/GameCanvas';
import GameHUD from '@/features/basket-game/ui/GameHUD';
import ModalWin from '@/widgets/modals/ui/ModalWin';
import ModalLose from '@/widgets/modals/ui/ModalLose';
import ModalBoosterHint from '@/widgets/modals/ui/ModalBoosterHint';
import ModalBoosterSelect from '@/widgets/modals/ui/ModalBoosterSelect';
import { LEVELS } from '@/features/basket-game/config/levels';
import type { BoosterType, ItemType } from '@/features/basket-game/model/types';

export default function GamePage() {
  const router = useRouter();
  const [levelId, setLevelId] = useState(1);
  const currentLevel = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];

  const {
    itemsRef,
    initGame,
    destroyChain,
    activateBoosterMode,
    cancelBooster,
    applyBooster,
  } = useGameEngine(currentLevel);

  const { status, activeBooster } = useGameStore();
  const { chainLineRef, handlers } = useMatchLogic(itemsRef, destroyChain);

  useEffect(() => {
    const t = setTimeout(initGame, 50);
    return () => clearTimeout(t);
  }, [levelId, initGame]);

  const handleBoosterClick = useCallback(
    (type: BoosterType) => {
      if (status === 'booster_mode' && activeBooster.type === type) {
        cancelBooster();
      } else {
        activateBoosterMode(type);
      }
    },
    [status, activeBooster, activateBoosterMode, cancelBooster],
  );

  const handleCanvasPointerDown = useCallback(
    (x: number, y: number) => {
      if (status === 'booster_mode' && activeBooster.type) {
        if (activeBooster.type === 'blender') return; // обрабатывается через ModalBoosterSelect

        for (const item of itemsRef.current.values()) {
          const dx = x - item.body.position.x;
          const dy = y - item.body.position.y;
          const r = item.body.circleRadius ?? 0;
          if (dx * dx + dy * dy <= r * r) {
            applyBooster(activeBooster.type, item.id);
            return;
          }
        }
        cancelBooster(); // тап мимо поля
        return;
      }
      handlers.handlePointerDown(x, y);
    },
    [status, activeBooster, itemsRef, applyBooster, cancelBooster, handlers],
  );

  const handleNextLevel = useCallback(() => {
    setLevelId((id) => Math.min(60, id + 1));
  }, []);

  const handleReplay = useCallback(() => { initGame(); }, [initGame]);

  const handleBlenderSelect = useCallback(
    (type: ItemType) => { applyBooster('blender', type); },
    [applyBooster],
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#14532d' }}>
      <GameCanvas
        itemsRef={itemsRef}
        chainLineRef={chainLineRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlers.handlePointerMove}
        onPointerUp={handlers.handlePointerUp}
      />

      <GameHUD onBoosterClick={handleBoosterClick} />

      {status === 'booster_mode' && activeBooster.type && activeBooster.type !== 'blender' && (
        <ModalBoosterHint boosterType={activeBooster.type} onCancel={cancelBooster} />
      )}

      {status === 'booster_mode' && activeBooster.type === 'blender' && (
        <ModalBoosterSelect
          availableTypes={currentLevel.availableTypes}
          onSelect={handleBlenderSelect}
          onCancel={cancelBooster}
        />
      )}

      {status === 'win' && (
        <ModalWin
          levelName={currentLevel.name}
          onNextLevel={handleNextLevel}
          onReplay={handleReplay}
        />
      )}

      {status === 'lose' && (
        <ModalLose onReplay={handleReplay} onBack={() => router.push('/')} />
      )}
    </div>
  );
}
