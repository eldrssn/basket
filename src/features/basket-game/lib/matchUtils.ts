import { VegetableBody } from '../model/types';
import { VEGETABLE_CONFIGS, VegetableType } from '../config/vegetables';

const MAX_CHAIN_DISTANCE = 90; // px — максимальное расстояние между соседями

export function isNeighbor(
  bodyA: VegetableBody,
  bodyB: VegetableBody,
): boolean {
  const dx = bodyA.matterBody.position.x - bodyB.matterBody.position.x;
  const dy = bodyA.matterBody.position.y - bodyB.matterBody.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const threshold =
    (bodyA.matterBody.circleRadius ?? 0) +
    (bodyB.matterBody.circleRadius ?? 0) +
    30;
  return dist <= Math.max(threshold, MAX_CHAIN_DISTANCE);
}

export function isSameType(a: VegetableBody, b: VegetableBody): boolean {
  // Золотые считаются своим base-типом для матча
  const baseType = (t: VegetableType): string =>
    t.startsWith('golden_') ? t.replace('golden_', '') : t;
  return baseType(a.type) === baseType(b.type);
}

export function canAddToChain(
  chain: VegetableBody[],
  candidate: VegetableBody,
): boolean {
  if (candidate.isFrozen || candidate.blockerState === 'stone') return false;
  if (chain.length === 0) return true;
  if (chain.some((v) => v.id === candidate.id)) return false;

  const last = chain[chain.length - 1];
  return isNeighbor(last, candidate) && isSameType(last, candidate);
}

export function calculateChainScore(chain: VegetableBody[]): number {
  if (chain.length < 3) return 0;

  const basePoints = 3;
  const baseScore = chain.length * basePoints;

  // Multipliers
  let multiplier = 1;

  if (chain.length >= 5) {
    multiplier *= 1.5;
  }

  if (chain.some((v) => v.isGolden)) {
    multiplier *= 2;
  }

  return Math.floor(baseScore * multiplier);
}
