import type { GameItem } from '../model/types';

// Порог: дополнительные px сверх суммы радиусов для признания соседства
const NEIGHBOR_THRESHOLD_EXTRA_PX = 35;

export function isNeighbor(a: GameItem, b: GameItem): boolean {
  const dx = a.body.position.x - b.body.position.x;
  const dy = a.body.position.y - b.body.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const threshold =
    (a.body.circleRadius ?? 0) +
    (b.body.circleRadius ?? 0) +
    NEIGHBOR_THRESHOLD_EXTRA_PX;
  return dist <= threshold;
}

// Золотой томат матчится с обычными томатами и наоборот
export function isSameBaseType(a: GameItem, b: GameItem): boolean {
  const baseA = a.type.startsWith('golden_') ? a.type.slice(7) : a.type;
  const baseB = b.type.startsWith('golden_') ? b.type.slice(7) : b.type;
  return baseA === baseB;
}

export function canAddToChain(chain: GameItem[], candidate: GameItem): boolean {
  // Предмет в сети не включается в цепочку
  if (candidate.netState !== null) return false;
  // Камень не участвует в цепочке
  if (candidate.stoneSize !== null) return false;

  if (chain.length === 0) return true;
  if (chain.some((item) => item.id === candidate.id)) return false;

  const last = chain[chain.length - 1];
  return isNeighbor(last, candidate) && isSameBaseType(last, candidate);
}

export function getNeighborsOfItem(
  targetId: string,
  allItems: Map<string, GameItem>,
): GameItem[] {
  const target = allItems.get(targetId);
  if (!target) return [];
  return Array.from(allItems.values()).filter(
    (item) => item.id !== targetId && isNeighbor(target, item),
  );
}
