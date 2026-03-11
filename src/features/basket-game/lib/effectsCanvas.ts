import type { GameItem, EffectParticle } from '../model/types';
import { ITEM_CONFIGS } from '../config/items';
import type { ItemType } from '../model/types';

// ─── ОБЪЕКТНЫЙ ПУЛ ЧАСТИЦ ───────────────────────────────────────────
// Фиксированный массив — никаких new объектов в hot path каждый кадр.

const MAX_PARTICLES = 300;

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

// ─── ПУБЛИЧНЫЙ API ──────────────────────────────────────────────────

export function spawnMatchEffect(chain: GameItem[]): void {
  for (const item of chain) {
    const { x, y } = item.body.position;
    const baseType = (
      item.type.startsWith('golden_') ? item.type.slice(7) : item.type
    ) as ItemType;
    const color = ITEM_CONFIGS[baseType]?.color ?? '#fff';

    for (let i = 0; i < 5; i++) {
      const angle = ((Math.PI * 2) / 5) * i + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;
      emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 3,
        color, 8 + Math.random() * 8, 'chunk', 40);
    }

    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      emit(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        Math.cos(angle) * speed, Math.sin(angle) * speed - 2,
        color, 3 + Math.random() * 4, 'juice', 30,
      );
    }

    if (item.isGolden) {
      for (let i = 0; i < 8; i++) {
        const angle = ((Math.PI * 2) / 8) * i;
        emit(x, y, Math.cos(angle) * 5, Math.sin(angle) * 5 - 4,
          '#FFD600', 10, 'star', 50);
      }
    }
  }
}

// Вызывается каждый кадр из физического RAF
export function updateParticles(): void {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = pool[i];
    if (p.age >= p.lifetime) continue;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25;
    p.vx *= 0.96;
    p.alpha = 1 - p.age / p.lifetime;
    p.age++;
  }
}

// Для рендера — перебираем пул, рендерим только живые (age < lifetime)
export function getParticlePool(): ReadonlyArray<EffectParticle> {
  return pool;
}
