import { useState, useRef, useCallback } from 'react';
import { VegetableBody } from './types';
import { canAddToChain } from '../lib/matchUtils';

export function useMatchLogic(
  vegetables: Map<string, VegetableBody>,
  onChainComplete: (chain: VegetableBody[]) => void,
) {
  const [chain, setChain] = useState<VegetableBody[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const chainLineRef = useRef<{ x: number; y: number }[]>([]);

  const hitTestVegetable = useCallback(
    (
      vegetables: Map<string, VegetableBody>,
      x: number,
      y: number,
    ): VegetableBody | null => {
      for (const veg of vegetables.values()) {
        const { position, circleRadius } = veg.matterBody;
        const dx = x - position.x;
        const dy = y - position.y;
        if (dx * dx + dy * dy <= (circleRadius ?? 0) * (circleRadius ?? 0)) {
          return veg;
        }
      }
      return null;
    },
    [],
  );

  const handlePointerDown = useCallback(
    (canvasX: number, canvasY: number) => {
      const hit = hitTestVegetable(vegetables, canvasX, canvasY);
      if (hit && canAddToChain([], hit)) {
        setIsDragging(true);
        setChain([hit]);
        chainLineRef.current = [
          { x: hit.matterBody.position.x, y: hit.matterBody.position.y },
        ];
      }
    },
    [vegetables, hitTestVegetable],
  );

  const handlePointerMove = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!isDragging || chain.length === 0) return;

      const hit = hitTestVegetable(vegetables, canvasX, canvasY);
      if (hit && canAddToChain(chain, hit)) {
        setChain((prev) => [...prev, hit]);
        chainLineRef.current = [
          ...chainLineRef.current,
          {
            x: hit.matterBody.position.x,
            y: hit.matterBody.position.y,
          },
        ];
      }

      // Отмена последнего (drag назад)
      if (chain.length >= 2) {
        const secondLast = chain[chain.length - 2];
        const hitId = hitTestVegetable(vegetables, canvasX, canvasY)?.id;
        if (hitId === secondLast.id) {
          setChain((prev) => prev.slice(0, -1));
          chainLineRef.current = chainLineRef.current.slice(0, -1);
        }
      }
    },
    [isDragging, chain, vegetables, hitTestVegetable],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (chain.length >= 3) {
      onChainComplete(chain);
    }
    setChain([]);
    chainLineRef.current = [];
  }, [chain, onChainComplete]);

  return {
    chain,
    isDragging,
    chainLineRef,
    handlers: { handlePointerDown, handlePointerMove, handlePointerUp },
  };
}
