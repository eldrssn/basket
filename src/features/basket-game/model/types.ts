import Matter from 'matter-js';
import { VegetableType } from '../config/vegetables';

export type GameStatus =
  | 'idle' // ещё не начата
  | 'playing' // идёт игра
  | 'paused' // пауза
  | 'win' // победа
  | 'lose_moves' // закончились ходы
  | 'lose_overflow'; // овощи вышли за линию

export type BlockerType = 'none' | 'ice' | 'stone';

export interface VegetableBody {
  id: string;
  matterBody: Matter.Body;
  type: VegetableType;
  blockerState: BlockerType; // none = обычный, ice = заморожен, stone = камень
  isSelected: boolean;
  isFrozen: boolean; // заморожен льдом
  isGolden: boolean;
  frozenTurnsLeft: number; // сколько матчей рядом нужно для размораживания
}

export interface ChainNode {
  vegetableId: string;
  position: { x: number; y: number };
}

export interface BoosterInventory {
  blender: number; // Блендер
  skewer: number; // Шампур
  watering: number; // Лейка
  rake: number; // Грабли
  secateur: number; // Секатор (второй шанс)
  extraMoves: number; // +5 ходов (второй шанс)
}

export type BoosterType = keyof BoosterInventory;

export interface GameState {
  status: GameStatus;
  score: number;
  movesLeft: number;
  harvestProgress: number; // 0..100
  harvestGoal: number; // цель: сколько % нужно набрать
  currentChain: ChainNode[];
  boosters: BoosterInventory;
  seedPackets: number; // пакетики семян для мета-игры
}

export interface EffectParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  type: 'juice' | 'chunk' | 'star' | 'sparkle';
  lifetime: number;
  age: number;
}
