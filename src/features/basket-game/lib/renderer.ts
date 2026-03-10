import { VegetableBody, EffectParticle } from '../model/types';
import { VEGETABLE_CONFIGS, VEGETABLE_LABELS } from '../config/vegetables';

export function renderVegetable(
  ctx: CanvasRenderingContext2D,
  veg: VegetableBody,
  sprites: Map<string, HTMLImageElement>,
  isSelected: boolean,
) {
  const { position, circleRadius, angle } = veg.matterBody;
  const config = VEGETABLE_CONFIGS[veg.type];

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);

  // Тень для выбранных
  if (isSelected) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 12;
  }

  const sprite = sprites.get(veg.type);
  if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
    const r = circleRadius!;
    ctx.drawImage(sprite, -r, -r, r * 2, r * 2);
  } else {
    // Fallback: цветной круг с буквой
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius!, 0, Math.PI * 2);
    ctx.fillStyle = config.color;
    ctx.fill();

    // Draw Letter
    ctx.fillStyle = 'white';
    ctx.font = `bold ${circleRadius! * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = VEGETABLE_LABELS[veg.type.replace('golden_', '')] || '?';
    ctx.fillText(label, 0, 0);
  }

  // Ледяная корка
  if (veg.isFrozen) {
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius! + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.7)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.25)';
    ctx.fill();
  }

  // Золотое свечение
  if (veg.isGolden) {
    const glow = ctx.createRadialGradient(
      0,
      0,
      circleRadius! * 0.5,
      0,
      0,
      circleRadius! * 1.5,
    );
    glow.addColorStop(0, 'rgba(255, 214, 0, 0)');
    glow.addColorStop(1, 'rgba(255, 214, 0, 0.4)');
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius! * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  ctx.restore();
}

export function renderChainLine(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  isValid: boolean,
) {
  if (points.length < 2) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    // Плавная кривая через точки
    const prev = points[i - 1];
    const curr = points[i];
    const mx = (prev.x + curr.x) / 2;
    const my = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
  }

  ctx.strokeStyle = isValid ? '#4CAF50' : '#9E9E9E';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(isValid ? [] : [8, 4]);
  // Эффект стебля: тёмный контур + светлый центр
  ctx.shadowColor = isValid ? 'rgba(76, 175, 80, 0.5)' : 'transparent';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();
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
      if (ctx.roundRect) {
        ctx.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 3);
      } else {
        ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
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
