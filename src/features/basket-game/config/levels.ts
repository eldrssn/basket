import { VegetableType } from './vegetables';
import { BoosterInventory, BoosterType } from '../model/types';

export interface InitialBlocker {
  type: VegetableType;
  position: 'left' | 'center' | 'right' | 'random';
}

export interface PreFilledVegetable {
  type: VegetableType;
  count: number;
}

export interface LevelConfig {
  id: number;
  name: string;

  // Цель уровня
  harvestGoal: number; // % шкалы урожая для победы (обычно 100)
  movesLimit: number; // кол-во ходов (матчей) на уровень

  // Спавн
  spawnInterval: number; // мс между спавнами (1500 → 400)
  vegetableTypes: VegetableType[]; // какие овощи могут спавниться
  spawnWeights: Record<VegetableType, number>; // вес каждого типа (вероятность)
  goldenChance: number; // вероятность спавна золотого овоща (0..1)
  maxVegetables: number; // Максимальное кол-во овощей на поле (одновременно)

  // Блокеры
  blockers: {
    watermelonEnabled: boolean;
    pumpkinEnabled: boolean;
    iceEnabled: boolean;
    iceChance: number; // 0..1
    stonesEnabled: boolean;
    stoneChance: number; // 0..1
    initialBlockers: InitialBlocker[]; // стартовые блокеры в лукошке
  };

  // Сложность
  preFilledVegetables: PreFilledVegetable[]; // объекты уже в лукошке на старте

  // Бустеры доступные на уровне
  availableBoosters: BoosterType[];

  // Стартовый инвентарь бустеров
  startBoosters: Partial<BoosterInventory>;

  // Метаданные
  zone: 'garden' | 'greenhouse' | 'orchard' | 'house' | 'bbq' | 'terrace';
  backgroundVariant: number; // 1..3 вариант фона зоны
}

// ─── ГЕНЕРАТОР УРОВНЕЙ ───────────────────────────────────────────────

export function generateLevel(id: number): LevelConfig {
  const isEasy = id <= 10;
  const isMedium = id > 10 && id <= 50;
  const isHard = id > 50;

  const spawnInterval = isEasy
    ? 1500
    : isMedium
      ? Math.max(900, 1500 - (id - 10) * 15)
      : Math.max(400, 900 - (id - 50) * 10);

  const vegetableTypes: VegetableType[] = isEasy
    ? ['tomato', 'cucumber', 'pepper']
    : isMedium
      ? id <= 30
        ? ['tomato', 'cucumber', 'pepper', 'eggplant']
        : ['tomato', 'cucumber', 'pepper', 'eggplant', 'onion']
      : ['tomato', 'cucumber', 'pepper', 'eggplant', 'onion', 'carrot'];

  // Равные веса по умолчанию — в конкретных уровнях можно переопределить
  const spawnWeights = Object.fromEntries(
    vegetableTypes.map((t) => [t, 1]),
  ) as Record<VegetableType, number>;

  const movesLimit = isEasy
    ? 30
    : isMedium
      ? Math.max(20, 30 - Math.floor((id - 10) / 5))
      : Math.max(12, 20 - Math.floor((id - 50) / 3));

  const watermelonEnabled = id >= 15;
  const iceEnabled = id >= 25;
  const stonesEnabled = id >= 35;

  const preFilledCount = isHard ? Math.min(6, Math.floor((id - 50) / 5)) : 0;
  const preFilledVegetables: PreFilledVegetable[] =
    preFilledCount > 0 ? [{ type: 'tomato', count: preFilledCount }] : [];

  return {
    id,
    name: `Уровень ${id}`,
    harvestGoal: 100,
    movesLimit,
    spawnInterval,
    vegetableTypes,
    spawnWeights,
    goldenChance: isEasy ? 0.05 : isMedium ? 0.08 : 0.12,
    maxVegetables: 45, // Default max
    blockers: {
      watermelonEnabled,
      pumpkinEnabled: id >= 20,
      iceEnabled,
      iceChance: 0.1,
      stonesEnabled,
      stoneChance: 0.1,
      initialBlockers:
        isHard && id % 10 === 0
          ? [{ type: 'watermelon', position: 'center' }]
          : [],
    },
    preFilledVegetables,
    availableBoosters: ['blender', 'skewer', 'watering', 'rake'],
    startBoosters: isEasy ? { blender: 1, skewer: 1 } : {},
    zone:
      id <= 10
        ? 'garden'
        : id <= 20
          ? 'greenhouse'
          : id <= 35
            ? 'orchard'
            : id <= 45
              ? 'house'
              : id <= 53
                ? 'bbq'
                : 'terrace',
    backgroundVariant: ((id - 1) % 3) + 1,
  };
}

// Генерируем все 60 уровней
export const LEVELS: LevelConfig[] = Array.from({ length: 60 }, (_, i) =>
  generateLevel(i + 1),
);
