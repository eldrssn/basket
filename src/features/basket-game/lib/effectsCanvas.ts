import { VegetableBody, EffectParticle } from '../model/types';
import { VEGETABLE_CONFIGS } from '../config/vegetables';

export function spawnMatchEffect(
  particles: EffectParticle[],
  chain: VegetableBody[],
): EffectParticle[] {
  const newParticles: EffectParticle[] = [];

  for (const veg of chain) {
    const { x, y } = veg.matterBody.position;
    const config = VEGETABLE_CONFIGS[veg.type];

    // 4–6 кусков овоща
    for (let i = 0; i < 5; i++) {
      const angle = ((Math.PI * 2) / 5) * i + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;
      newParticles.push({
        id: `chunk-${Date.now()}-${i}-${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: config.color,
        size: 8 + Math.random() * 8,
        alpha: 1,
        type: 'chunk',
        lifetime: 40,
        age: 0,
      });
    }

    // 6–8 брызг сока
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      newParticles.push({
        id: `juice-${Date.now()}-${i}-${Math.random()}`,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: config.color,
        size: 3 + Math.random() * 4,
        alpha: 0.9,
        type: 'juice',
        lifetime: 30,
        age: 0,
      });
    }

    // Звёздочки для золотых
    if (veg.type.startsWith('golden_')) {
      for (let i = 0; i < 8; i++) {
        const angle = ((Math.PI * 2) / 8) * i;
        newParticles.push({
          id: `star-${Date.now()}-${i}-${Math.random()}`,
          x,
          y,
          vx: Math.cos(angle) * 5,
          vy: Math.sin(angle) * 5 - 4,
          color: '#FFD600',
          size: 10,
          alpha: 1,
          type: 'star',
          lifetime: 50,
          age: 0,
        });
      }
    }
  }

  return [...particles, ...newParticles];
}

export function updateParticles(particles: EffectParticle[]): EffectParticle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.25, // гравитация
      vx: p.vx * 0.96, // затухание X
      alpha: p.alpha * (1 - p.age / p.lifetime) * 1.02,
      age: p.age + 1,
    }))
    .filter((p) => p.age < p.lifetime && p.alpha > 0.01);
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: EffectParticle[],
) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'chunk') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 3);
      ctx.fill();
    } else if (p.type === 'juice') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        p.size,
        p.size * 0.6,
        Math.atan2(p.vy, p.vx),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else if (p.type === 'star') {
      drawStar(ctx, p.x, p.y, 5, p.size, p.size * 0.4);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}
