import type { GameItem } from '../model/types';

// GDD таблица очков:
// Длина 3 → 3×3 = 9
// Длина 4 → 3×4 = 12
// Длина 5 → 3×5×1.5 = 22 (округление вниз)
// Длина 6 → 3×6×1.5 = 27
// Золотой + длина 3 → 9×2 = 18
// Золотой + длина 6 → 27×2 = 54

export function calculateChainScore(chain: GameItem[]): number {
  if (chain.length < 3) return 0;

  const rawSum = chain.length * 3;
  const comboMultiplier = chain.length >= 5 ? 1.5 : 1.0;
  const hasGolden = chain.some((item) => item.isGolden);
  const goldenMultiplier = hasGolden ? 2.0 : 1.0;

  return Math.floor(rawSum * comboMultiplier * goldenMultiplier);
}

// Процент заполнения прогресс-бара за одну цепочку
export function calculateHarvestProgress(
  chainScore: number,
  harvestGoalPoints: number,
): number {
  if (harvestGoalPoints <= 0) return 0;
  return (chainScore / harvestGoalPoints) * 100;
}
