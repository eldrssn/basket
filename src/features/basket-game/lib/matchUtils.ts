import type { GameItem } from '../model/types';
import { NEIGHBOR_THRESHOLD_EXTRA_PX } from '../config/constants';

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

// Golden tomato matches with regular tomatoes and vice versa
export function isSameBaseType(a: GameItem, b: GameItem): boolean {
  const baseA = a.type.startsWith('golden_') ? a.type.slice(7) : a.type;
  const baseB = b.type.startsWith('golden_') ? b.type.slice(7) : b.type;
  return baseA === baseB;
}

export function canAddToChain(chain: GameItem[], candidate: GameItem): boolean {
  // Stones cannot be part of a chain
  if (candidate.stoneSize !== null) return false;

  if (chain.length === 0) return true;
  if (chain.some((item) => item.id === candidate.id)) return false;

  const last = chain[chain.length - 1];
  return isNeighbor(last, candidate) && isSameBaseType(last, candidate);
}

// GDD: liana cannot cross itself
export function wouldSelfIntersect(
  chain: GameItem[],
  candidate: GameItem,
): boolean {
  if (chain.length < 2) return false;

  const newStart = chain[chain.length - 1].body.position;
  const newEnd = candidate.body.position;

  for (let i = 0; i < chain.length - 2; i++) {
    const segStart = chain[i].body.position;
    const segEnd = chain[i + 1].body.position;
    if (segmentsIntersect(newStart, newEnd, segStart, segEnd)) {
      return true;
    }
  }
  return false;
}

function segmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number },
): boolean {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-8) return false;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / cross;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / cross;
  return t > 0.05 && t < 0.95 && u > 0.05 && u < 0.95;
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
