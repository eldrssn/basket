import type {
  ItemType,
  FieldItemType,
  NetState,
  StoneSize,
  BoosterType,
  BoosterInventory,
} from '../model/types';

export interface PresetItem {
  type: FieldItemType;
  count: number;
}

export interface NetBlockerConfig {
  wrapsType: ItemType;
  initialState: NetState;
  count: number;
}

export interface StoneBlockerConfig {
  size: StoneSize;
  count: number;
}

export type MapZone =
  | 'garden'
  | 'greenhouse'
  | 'orchard'
  | 'house'
  | 'bbq'
  | 'terrace';

export interface LevelConfig {
  id: number;
  name: string;

  // Level goal: points needed for 100% progress
  harvestGoalPoints: number;

  // Constraint: moves only (not time)
  movesLimit: number;

  // Total number of items in the basket
  totalItems: number;

  // Items
  availableTypes: ItemType[];
  spawnWeights: Partial<Record<ItemType, number>>;
  goldenSpawnChance: number; // 0..1

  // Preset objects (already in basket at start)
  presetItems: PresetItem[];

  // Blockers at start
  netBlockers: NetBlockerConfig[];
  stoneBlockers: StoneBlockerConfig[];

  // Blocker spawn probability on refill (0..1)
  blockerSpawnChance: number;

  // Boosters
  availableBoosters: BoosterType[];
  startBoosters: Partial<BoosterInventory>;

  // Map zone
  zone: MapZone;
}

// ─── LEVEL GENERATOR ────────────────────────────────────────────────

export function generateLevel(id: number): LevelConfig {
  const isEasy = id <= 10;
  const isMedium = id > 10 && id <= 50;
  const isHard = id > 50;

  const availableTypes: ItemType[] =
    id <= 10 ? ['tomato', 'cucumber', 'carrot'] :
    id <= 20 ? ['tomato', 'cucumber', 'carrot', 'pepper'] :
    id <= 35 ? ['tomato', 'cucumber', 'carrot', 'pepper', 'eggplant'] :
    id <= 50 ? ['tomato', 'cucumber', 'carrot', 'pepper', 'eggplant', 'beet'] :
               ['tomato', 'cucumber', 'carrot', 'pepper', 'eggplant', 'beet', 'apple'];

  const movesLimit =
    isEasy   ? 35 :
    isMedium ? Math.max(18, 35 - Math.floor((id - 10) / 4)) :
               Math.max(12, 18 - Math.floor((id - 50) / 3));

  const harvestGoalPoints =
    isEasy   ? 80 + id * 10 :
    isMedium ? 150 + (id - 10) * 15 :
               750 + (id - 50) * 30;

  const zone: MapZone =
    id <= 10 ? 'garden' :
    id <= 20 ? 'greenhouse' :
    id <= 35 ? 'orchard' :
    id <= 45 ? 'house' :
    id <= 53 ? 'bbq' :
               'terrace';

  const presetItems: PresetItem[] =
    isHard
      ? [{ type: availableTypes[0], count: 4 + Math.floor((id - 50) / 5) }]
      : isEasy
        ? [{ type: 'tomato', count: 3 }]
        : [
            { type: availableTypes[0], count: 3 },
            { type: availableTypes[1], count: 2 },
          ];

  const netBlockers: NetBlockerConfig[] =
    id >= 8
      ? [{
          wrapsType: 'tomato',
          initialState: 'strong' as NetState,
          count: id <= 20 ? 1 : 2,
        }]
      : [];

  const stoneBlockers: StoneBlockerConfig[] =
    id >= 20
      ? [{
          size: (id >= 40 ? 'large' : id >= 30 ? 'medium' : 'small') as StoneSize,
          count: 1,
        }]
      : [];

  const totalItems = isEasy ? 20 : isMedium ? 25 : 30;

  return {
    id,
    name: `Level ${id}`,
    harvestGoalPoints,
    movesLimit,
    totalItems,
    availableTypes,
    spawnWeights: Object.fromEntries(availableTypes.map((t) => [t, 1])),
    goldenSpawnChance: isEasy ? 0.05 : isMedium ? 0.08 : 0.12,
    presetItems,
    netBlockers,
    stoneBlockers,
    blockerSpawnChance: isEasy ? 0 : isMedium ? 0.05 : 0.1,
    availableBoosters: ['watering', 'skewer', 'blender'],
    startBoosters: isEasy && id <= 3 ? { watering: 1, skewer: 1 } : {},
    zone,
  };
}

export const LEVELS: LevelConfig[] = Array.from({ length: 60 }, (_, i) =>
  generateLevel(i + 1),
);
