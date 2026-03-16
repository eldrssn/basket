'use client';

import { useRef, useCallback } from 'react';
import type { GameItem } from './types';
import { canAddToChain, wouldSelfIntersect } from '../lib/matchUtils';

export function useMatchLogic(
  itemsRef: React.MutableRefObject<Map<string, GameItem>>,
  onChainComplete: (chain: GameItem[]) => void,
) {
  const chainRef = useRef<GameItem[]>([]);
  const isDraggingRef = useRef(false);
  const chainLineRef = useRef<{ x: number; y: number }[]>([]);

  const hitTest = useCallback(
    (x: number, y: number): GameItem | null => {
      for (const item of itemsRef.current.values()) {
        const { position, circleRadius } = item.body;
        const dx = x - position.x;
        const dy = y - position.y;
        if (dx * dx + dy * dy <= (circleRadius ?? 0) * (circleRadius ?? 0)) {
          return item;
        }
      }
      return null;
    },
    [itemsRef],
  );

  const handlePointerDown = useCallback(
    (x: number, y: number) => {
      const hit = hitTest(x, y);
      if (hit && canAddToChain([], hit)) {
        isDraggingRef.current = true;
        hit.isSelected = true;
        chainRef.current = [hit];
        chainLineRef.current = [{ x: hit.body.position.x, y: hit.body.position.y }];
      }
    },
    [hitTest],
  );

  const handlePointerMove = useCallback(
    (x: number, y: number) => {
      if (!isDraggingRef.current || chainRef.current.length === 0) return;

      const chain = chainRef.current;
      const hit = hitTest(x, y);
      if (!hit) return;

      // Add to chain (with liana self-intersection check)
      if (canAddToChain(chain, hit) && !wouldSelfIntersect(chain, hit)) {
        hit.isSelected = true;
        chainRef.current = [...chain, hit];
        chainLineRef.current = [
          ...chainLineRef.current,
          { x: hit.body.position.x, y: hit.body.position.y },
        ];
        return;
      }

      // Undo last step — drag back to previous item
      if (chain.length >= 2 && hit.id === chain[chain.length - 2].id) {
        const removed = chain[chain.length - 1];
        removed.isSelected = false;
        chainRef.current = chain.slice(0, -1);
        chainLineRef.current = chainLineRef.current.slice(0, -1);
      }
    },
    [hitTest],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    const chain = chainRef.current;

    if (chain.length >= 3) {
      onChainComplete(chain);
    }

    for (const item of chain) {
      item.isSelected = false;
    }
    chainRef.current = [];
    chainLineRef.current = [];
  }, [onChainComplete]);

  return {
    chainRef,
    chainLineRef,
    handlers: { handlePointerDown, handlePointerMove, handlePointerUp },
  };
}
