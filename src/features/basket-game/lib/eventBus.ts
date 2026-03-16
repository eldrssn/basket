import type { BoosterType, GameStatus } from '../model/types';

// Typed event map — all game domain events
export type GameEventMap = {
  'chain:destroyed': { removedIds: string[]; count: number; score: number };
  'booster:applied': { type: BoosterType; removedCount: number };
  'items:respawn': { count: number };
  'blocker:hit': { blockerId: string; destroyed: boolean };
  'game:statusChanged': { from: GameStatus; to: GameStatus };
};

type Handler<K extends keyof GameEventMap> = (payload: GameEventMap[K]) => void;

class GameEventBus {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof GameEventMap>(event: K, handler: Handler<K>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    // Return unsubscribe function
    return () => { this.listeners.get(event)?.delete(handler); };
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Module singleton — synchronous, no async dispatch
export const gameEvents = new GameEventBus();
