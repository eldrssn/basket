import { useCallback } from 'react';
import Matter from 'matter-js';
import type { GameItem, BoosterType, ItemType } from './types';
import { useGameStore } from './useGameStore';
import { spawnMatchEffect } from '../lib/effectsCanvas';
import { NEIGHBOR_THRESHOLD_EXTRA_PX } from '../config/constants';
import { gameEvents } from '../lib/eventBus';

export function useBoosterLogic(
  engineRef: React.MutableRefObject<Matter.Engine | null>,
  itemsRef: React.MutableRefObject<Map<string, GameItem>>,
  respawnAfterMatch: (count: number) => void,
) {
  const activateBoosterMode = useCallback((type: BoosterType) => {
    const store = useGameStore.getState();
    if (store.boosters[type] <= 0) return;
    useGameStore.getState().setStatus('booster_mode');
    useGameStore.getState().setActiveBooster({ type, targetId: null });
  }, []);

  const cancelBooster = useCallback(() => {
    useGameStore.getState().setStatus('playing');
    useGameStore.getState().setActiveBooster({ type: null });
  }, []);

  const applyBooster = useCallback(
    (type: BoosterType, arg: string | ItemType) => {
      if (!engineRef.current) return;
      let removedCount = 0;

      switch (type) {
        case 'watering': {
          // All neighbors become same type as target
          const target = itemsRef.current.get(arg);
          if (!target || target.stoneSize !== null) break;
          const baseType = target.type.startsWith('golden_')
            ? (target.type.slice(7) as ItemType)
            : (target.type as ItemType);
          const cr = target.body.circleRadius ?? 0;
          for (const item of itemsRef.current.values()) {
            if (item.id === arg || item.stoneSize !== null) continue;
            const mr = item.body.circleRadius ?? 0;
            const dx = target.body.position.x - item.body.position.x;
            const dy = target.body.position.y - item.body.position.y;
            if (Math.sqrt(dx * dx + dy * dy) <= cr + mr + NEIGHBOR_THRESHOLD_EXTRA_PX) {
              item.type = item.isGolden ? `golden_${baseType}` : baseType;
            }
          }
          break;
        }
        case 'skewer': {
          // Remove any single object
          const target = itemsRef.current.get(arg);
          if (!target) break;
          Matter.World.remove(engineRef.current.world, target.body);
          itemsRef.current.delete(arg);
          removedCount = 1;
          respawnAfterMatch(1);
          break;
        }
        case 'blender': {
          // Remove all items of selected type
          const targetType = arg as ItemType;
          const toRemove: GameItem[] = [];
          for (const item of itemsRef.current.values()) {
            if (item.stoneSize !== null) continue;
            const bt = item.type.startsWith('golden_')
              ? (item.type.slice(7) as ItemType)
              : (item.type as ItemType);
            if (bt === targetType) toRemove.push(item);
          }
          for (const item of toRemove) {
            Matter.World.remove(engineRef.current.world, item.body);
            itemsRef.current.delete(item.id);
          }
          spawnMatchEffect(toRemove);
          removedCount = toRemove.length;
          respawnAfterMatch(toRemove.length);
          break;
        }
      }

      useGameStore.getState().consumeBooster(type);
      useGameStore.getState().setStatus('playing');
      useGameStore.getState().setActiveBooster({ type: null });

      gameEvents.emit('booster:applied', { type, removedCount });
    },
    [engineRef, itemsRef, respawnAfterMatch],
  );

  return { activateBoosterMode, cancelBooster, applyBooster };
}
