import type { GameItem, EffectParticle } from '../model/types';
import { ITEM_CONFIGS } from '../config/items';
import type { ItemType } from '../model/types';
import {
  MAX_PARTICLES,
  PARTICLE_GRAVITY,
  PARTICLE_VX_DAMPING,
  CHUNK_COUNT, CHUNK_SPEED_MIN, CHUNK_SPEED_RANGE, CHUNK_SIZE_MIN, CHUNK_SIZE_RANGE, CHUNK_LIFETIME,
  JUICE_COUNT, JUICE_SPEED_MIN, JUICE_SPEED_RANGE, JUICE_SIZE_MIN, JUICE_SIZE_RANGE, JUICE_LIFETIME,
  STAR_COUNT, STAR_SPEED, STAR_SIZE, STAR_LIFETIME,
} from '../config/constants';

// ─── PARTICLE OBJECT POOL ────────────────────────────────────────────
// Fixed-size array — no allocations in the hot path each frame.

const pool: EffectParticle[] = Array.from({ length: MAX_PARTICLES }, (_, i) => ({
  id: `p${i}`,
  x: 0, y: 0, vx: 0, vy: 0,
  color: '#fff',
  size: 0,
  alpha: 0,
  type: 'chunk' as const,
  lifetime: 1,
  age: 1, // age >= lifetime = dead
}));

function acquireSlot(): EffectParticle | null {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (pool[i].age >= pool[i].lifetime) return pool[i];
  }
  return null;
}

function emit(
  x: number, y: number,
  vx: number, vy: number,
  color: string,
  size: number,
  type: EffectParticle['type'],
  lifetime: number,
): void {
  const slot = acquireSlot();
  if (!slot) return;
  slot.x = x;   slot.y = y;
  slot.vx = vx; slot.vy = vy;
  slot.color = color;
  slot.size = size;
  slot.alpha = 1;
  slot.type = type;
  slot.lifetime = lifetime;
  slot.age = 0;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────

export function spawnMatchEffect(chain: GameItem[]): void {
  for (const item of chain) {
    const { x, y } = item.body.position;
    const baseType = (
      item.type.startsWith('golden_') ? item.type.slice(7) : item.type
    ) as ItemType;
    const color = ITEM_CONFIGS[baseType]?.color ?? '#fff';

    for (let i = 0; i < CHUNK_COUNT; i++) {
      const angle = ((Math.PI * 2) / CHUNK_COUNT) * i + Math.random() * 0.5;
      const speed = CHUNK_SPEED_MIN + Math.random() * CHUNK_SPEED_RANGE;
      emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 3,
        color, CHUNK_SIZE_MIN + Math.random() * CHUNK_SIZE_RANGE, 'chunk', CHUNK_LIFETIME);
    }

    for (let i = 0; i < JUICE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = JUICE_SPEED_MIN + Math.random() * JUICE_SPEED_RANGE;
      emit(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        Math.cos(angle) * speed, Math.sin(angle) * speed - 2,
        color, JUICE_SIZE_MIN + Math.random() * JUICE_SIZE_RANGE, 'juice', JUICE_LIFETIME,
      );
    }

    if (item.isGolden) {
      for (let i = 0; i < STAR_COUNT; i++) {
        const angle = ((Math.PI * 2) / STAR_COUNT) * i;
        emit(x, y, Math.cos(angle) * STAR_SPEED, Math.sin(angle) * STAR_SPEED - 4,
          '#FFD600', STAR_SIZE, 'star', STAR_LIFETIME);
      }
    }
  }
}

// Called every frame from the physics RAF
export function updateParticles(): void {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = pool[i];
    if (p.age >= p.lifetime) continue;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += PARTICLE_GRAVITY;
    p.vx *= PARTICLE_VX_DAMPING;
    p.alpha = 1 - p.age / p.lifetime;
    p.age++;
  }
}

// Returns alive particle count for debug stats
export function getAliveParticleCount(): number {
  let count = 0;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (pool[i].age < pool[i].lifetime) count++;
  }
  return count;
}

// For rendering — iterate pool, render only alive (age < lifetime)
export function getParticlePool(): ReadonlyArray<EffectParticle> {
  return pool;
}
