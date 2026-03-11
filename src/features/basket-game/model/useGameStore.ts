import { create } from 'zustand';
import type {
  GameStatus,
  GameState,
  ActiveBoosterState,
  BoosterType,
  BoosterInventory,
} from './types';

interface GameStore extends GameState {
  // Mutations
  setStatus: (status: GameStatus) => void;
  setActiveBooster: (state: ActiveBoosterState) => void;
  setChain: (ids: string[]) => void;
  addScore: (points: number) => void;
  addProgress: (pct: number) => void;
  decrementMoves: () => void;
  consumeBooster: (type: BoosterType) => void;
  resetGame: (params: {
    levelId: number;
    movesLimit: number;
    harvestGoalPoints: number;
    startBoosters: Partial<BoosterInventory>;
  }) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  status: 'idle',
  levelId: 1,
  score: 0,
  movesLeft: 0,
  harvestProgress: 0,
  harvestGoal: 100,
  currentChain: [],
  activeBooster: { type: null },
  boosters: { watering: 0, skewer: 0, blender: 0 },

  setStatus: (status) => set({ status }),

  setActiveBooster: (activeBooster) => set({ activeBooster }),

  setChain: (currentChain) => set({ currentChain }),

  addScore: (points) => set((s) => ({ score: s.score + points })),

  addProgress: (pct) =>
    set((s) => ({ harvestProgress: Math.min(100, s.harvestProgress + pct) })),

  decrementMoves: () => set((s) => ({ movesLeft: s.movesLeft - 1 })),

  consumeBooster: (type) =>
    set((s) => ({
      boosters: {
        ...s.boosters,
        [type]: Math.max(0, s.boosters[type] - 1),
      },
    })),

  resetGame: ({ levelId, movesLimit, harvestGoalPoints, startBoosters }) =>
    set({
      status: 'idle',
      levelId,
      score: 0,
      movesLeft: movesLimit,
      harvestProgress: 0,
      harvestGoal: harvestGoalPoints,
      currentChain: [],
      activeBooster: { type: null },
      boosters: {
        watering: 0,
        skewer: 0,
        blender: 0,
        ...startBoosters,
      },
    }),
}));
