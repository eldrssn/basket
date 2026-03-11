import type { NetState, StoneSize } from '../model/types';

// ─── СЕТЬ ───────────────────────────────────────────────────────────
// GDD: обвязывает предмет. Деградирует за 1 матч рядом: strong → weak → fragile → уничтожена.
// Предмет в сети не участвует в цепочке. При уничтожении сети — предмет становится свободным.

export interface NetConfig {
  state: NetState;
  spriteOverlay: string;
  // Fallback color overlay for when sprite not loaded
  overlayColor: string;
}

export const NET_CONFIGS: Record<NetState, NetConfig> = {
  strong: {
    state: 'strong',
    spriteOverlay: '/game/blockers/net_strong.png',
    overlayColor: 'rgba(101, 67, 33, 0.80)',
  },
  weak: {
    state: 'weak',
    spriteOverlay: '/game/blockers/net_weak.png',
    overlayColor: 'rgba(101, 67, 33, 0.55)',
  },
  fragile: {
    state: 'fragile',
    spriteOverlay: '/game/blockers/net_fragile.png',
    overlayColor: 'rgba(101, 67, 33, 0.30)',
  },
};

// null = сеть уничтожена, предмет свободен
export const NET_PROGRESSION: Record<NetState, NetState | null> = {
  strong: 'weak',
  weak: 'fragile',
  fragile: null,
};

// ─── КАМЕНЬ ─────────────────────────────────────────────────────────
// GDD: не участвует в цепочке. Уничтожается матчами рядом или бустером Шампур.
// large=3 матча рядом, medium=2, small=1

export interface StoneConfig {
  size: StoneSize;
  radius: number;
  mass: number;
  hitsToDestroy: number;
  spriteSrc: string;
  color: string;
}

export const STONE_CONFIGS: Record<StoneSize, StoneConfig> = {
  large: {
    size: 'large',
    radius: 52,
    mass: 12,
    hitsToDestroy: 3,
    spriteSrc: '/game/blockers/stone_large.png',
    color: '#78909C',
  },
  medium: {
    size: 'medium',
    radius: 38,
    mass: 8,
    hitsToDestroy: 2,
    spriteSrc: '/game/blockers/stone_medium.png',
    color: '#90A4AE',
  },
  small: {
    size: 'small',
    radius: 26,
    mass: 5,
    hitsToDestroy: 1,
    spriteSrc: '/game/blockers/stone_small.png',
    color: '#B0BEC5',
  },
};
