'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { GameItem } from '../model/types';
import { ITEM_CONFIGS, ITEM_LABELS } from '../config/items';
import { NET_CONFIGS, STONE_CONFIGS } from '../config/blockers';
import { getParticlePool } from '../lib/effectsCanvas';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { useGameStore } from '../model/useGameStore';
import type { ItemType } from '../model/types';

interface GameCanvasProps {
  itemsRef: React.MutableRefObject<Map<string, GameItem>>;
  chainLineRef: React.MutableRefObject<{ x: number; y: number }[]>;
  onPointerDown: (x: number, y: number) => void;
  onPointerMove: (x: number, y: number) => void;
  onPointerUp: () => void;
}

export default function GameCanvas({
  itemsRef,
  chainLineRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ImageBitmap кеш — быстрее HTMLImageElement при drawImage
  const bitmapCacheRef = useRef<Map<string, ImageBitmap>>(new Map());
  const scaleRef = useRef<number>(1);
  const rafRef = useRef<number>(0);

  const status = useGameStore((s) => s.status);
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  // Загрузка спрайтов отключена — используем fallback цветные круги
  // (раскомментировать когда спрайты будут добавлены в /public/game/)

  // ─── DPR-АДАПТИВНЫЙ CANVAS ──────────────────────────────────────────
  // Размер canvas подстраивается под контейнер с учётом DPR.
  // Логическое пространство игры GAME_WIDTH×GAME_HEIGHT масштабируется в CSS-пиксели.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const apply = () => {
      const { width: cssW, height: cssH } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      scaleRef.current = cssW / GAME_WIDTH;
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ─── РЕНДЕР-ЦИКЛ ────────────────────────────────────────────────────
  // Независимый RAF только для рендера.
  // Физика обновляется в useGameEngine.
  // Когда игра idle — рендер всё равно работает, показывая корзинку.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(render); return; }

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const scale = cssW / GAME_WIDTH;
      const scaleY = cssH / GAME_HEIGHT;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr * scale, dpr * scaleY);

      renderBasket(ctx);

      // Предметы
      itemsRef.current.forEach((item) => {
        renderItem(ctx, item, bitmapCacheRef.current);
      });

      // Частицы из пула
      const particles = getParticlePool();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.age >= p.lifetime) continue;
        renderParticle(ctx, p);
      }

      // Лиана цепочки
      const chain = chainLineRef.current;
      renderChainLine(ctx, chain);

      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [itemsRef, chainLineRef]);

  // ─── POINTER EVENTS ─────────────────────────────────────────────────
  const toLogical = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = scaleRef.current;
    const dpr = window.devicePixelRatio || 1;
    const cssH = canvasRef.current!.height / dpr;
    const scaleY = cssH / GAME_HEIGHT;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scaleY,
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', touchAction: 'none' }}
        onPointerDown={(e) => {
          const { x, y } = toLogical(e.clientX, e.clientY);
          onPointerDown(x, y);
        }}
        onPointerMove={(e) => {
          const { x, y } = toLogical(e.clientX, e.clientY);
          onPointerMove(x, y);
        }}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}

// ─── ФУНКЦИИ РЕНДЕРА ────────────────────────────────────────────────

function renderBasket(ctx: CanvasRenderingContext2D) {
  const basketW = GAME_WIDTH * 0.82;
  const basketH = GAME_HEIGHT * 0.52;
  const basketCX = GAME_WIDTH / 2;
  const basketCY = GAME_HEIGHT * 0.62;
  const wallT = 9;
  const r = 50; // радиус скругления углов

  const left = basketCX - basketW / 2;
  const right = basketCX + basketW / 2;
  const top = basketCY - basketH / 2;
  const bottom = basketCY + basketH / 2 + wallT;

  ctx.save();
  ctx.fillStyle = '#8D6E63';

  // U-образная форма через path
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom - r);
  ctx.quadraticCurveTo(left, bottom, left + r, bottom);
  ctx.lineTo(right - r, bottom);
  ctx.quadraticCurveTo(right, bottom, right, bottom - r);
  ctx.lineTo(right, top);
  ctx.lineTo(right - wallT, top);
  ctx.lineTo(right - wallT, bottom - r - wallT);
  ctx.quadraticCurveTo(right - wallT, bottom - wallT, right - wallT - r, bottom - wallT);
  ctx.lineTo(left + wallT + r, bottom - wallT);
  ctx.quadraticCurveTo(left + wallT, bottom - wallT, left + wallT, bottom - r - wallT);
  ctx.lineTo(left + wallT, top);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

import type { EffectParticle } from '../model/types';

function renderItem(
  ctx: CanvasRenderingContext2D,
  item: GameItem,
  cache: Map<string, ImageBitmap>,
) {
  const { position, circleRadius, angle } = item.body;
  const r = circleRadius ?? 20;
  const baseType = (
    item.type.startsWith('golden_') ? item.type.slice(7) : item.type
  ) as ItemType;
  const cfg = ITEM_CONFIGS[baseType];

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);

  // Тень для выбранных предметов
  if (item.isSelected) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 14;
  }

  // Спрайт или fallback-круг
  const bitmapKey = item.type; // 'golden_tomato' или 'tomato'
  const bitmap = cache.get(bitmapKey);
  if (bitmap) {
    ctx.drawImage(bitmap, -r, -r, r * 2, r * 2);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = item.isGolden ? '#FFD600' : (cfg?.color ?? '#888');
    ctx.fill();
    // Буква-подсказка
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(r * 0.75)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ITEM_LABELS[baseType] ?? '?', 0, 0);
  }

  ctx.shadowBlur = 0;

  // Золотое свечение
  if (item.isGolden) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.6);
    glow.addColorStop(0, 'rgba(255, 214, 0, 0)');
    glow.addColorStop(1, 'rgba(255, 214, 0, 0.35)');
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Накладка сети
  if (item.netState !== null) {
    const netCfg = NET_CONFIGS[item.netState];
    const netBmp = cache.get(`net_${item.netState}`);
    if (netBmp) {
      ctx.drawImage(netBmp, -r - 4, -r - 4, (r + 4) * 2, (r + 4) * 2);
    } else {
      // Fallback: полупрозрачный прямоугольник-сетка
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = netCfg.overlayColor;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }

  // Камень — серый поверх
  if (item.stoneSize !== null) {
    const stoneCfg = STONE_CONFIGS[item.stoneSize];
    const stoneBmp = cache.get(`stone_${item.stoneSize}`);
    if (stoneBmp) {
      ctx.drawImage(stoneBmp, -r, -r, r * 2, r * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = stoneCfg.color;
      ctx.fill();
      // Индикатор прочности
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `bold ${Math.floor(r * 0.6)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(item.stoneHitsLeft), 0, 0);
    }
  }

  ctx.restore();
}

function renderChainLine(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
) {
  if (points.length < 2) return;
  const isValid = points.length >= 3;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
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
  ctx.shadowColor = isValid ? 'rgba(76, 175, 80, 0.5)' : 'transparent';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();
}

function renderParticle(ctx: CanvasRenderingContext2D, p: EffectParticle) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.alpha);

  if (p.type === 'chunk') {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 3);
    } else {
      ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.fill();
  } else if (p.type === 'juice') {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'star') {
    drawStar(ctx, p.x, p.y, 5, p.size, p.size * 0.4);
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  spikes: number,
  outerR: number, innerR: number,
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}
