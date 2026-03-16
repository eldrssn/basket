import type { Body } from 'matter-js';

// ─── ITEMS ──────────────────────────────────────────────────────────

export type ItemType =
  | 'tomato'
  | 'carrot'
  | 'eggplant'
  | 'pepper'
  | 'beet'
  | 'cucumber'
  | 'apple'
  | 'orange'
  | 'strawberry'
  | 'blueberry';

export type GoldenItemType = `golden_${ItemType}`;
export type FieldItemType = ItemType | GoldenItemType;

// ─── BLOCKERS ───────────────────────────────────────────────────────

export type NetState = 'strong' | 'weak' | 'fragile';
export type StoneSize = 'large' | 'medium' | 'small';

// ─── PHYSICS BODIES ─────────────────────────────────────────────────

export interface GameItem {
  id: string;
  body: Body;
  type: FieldItemType;
  netState: NetState | null;
  stoneSize: StoneSize | null;
  stoneHitsLeft: number;
  isGolden: boolean;
  isSelected: boolean;
}

// ─── BOOSTERS ───────────────────────────────────────────────────────

export type BoosterType = 'watering' | 'skewer' | 'blender';

export interface BoosterInventory {
  watering: number;
  skewer: number;
  blender: number;
}

export type ActiveBoosterState =
  | { type: null }
  | { type: 'watering'; targetId: string | null }
  | { type: 'skewer'; targetId: string | null }
  | { type: 'blender'; targetId: string | null };

// ─── GAME STATE ─────────────────────────────────────────────────────

export type GameStatus =
  | 'idle'
  | 'playing'
  | 'booster_mode'
  | 'win'
  | 'lose';

export interface GameState {
  status: GameStatus;
  levelId: number;
  score: number;
  movesLeft: number;
  harvestProgress: number; // 0..100
  harvestGoal: number;     // target points for 100% (from LevelConfig.harvestGoalPoints)
  currentChain: string[];  // ids of items in current chain
  activeBooster: ActiveBoosterState;
  boosters: BoosterInventory;
}

// ─── PARTICLES ──────────────────────────────────────────────────────

export type ParticleType = 'chunk' | 'juice' | 'star';

export interface EffectParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  type: ParticleType;
  lifetime: number;
  age: number;
}
