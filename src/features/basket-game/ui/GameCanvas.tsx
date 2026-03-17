'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { GameItem } from '../model/types';
import { ITEM_CONFIGS, ITEM_LABELS } from '../config/items';
import { NET_CONFIGS, STONE_CONFIGS } from '../config/blockers';
import { getParticlePool } from '../lib/effectsCanvas';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { useGameStore } from '../model/useGameStore';
import type { ItemType } from '../model/types';
import {
  BASKET_RIM_HEIGHT,
  BASKET_WALL_THICKNESS,
  getBasketOutlinePoints,
  getBasketArchPoints,
} from '../lib/basket';
import {
  markRenderStart,
  markRenderEnd,
  renderDebugOverlay,
  toggleDebug,
} from '../lib/debugStats';
import { buildAssetManifest, loadAllAssets } from '../lib/assetLoader';

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
  // ImageBitmap cache — faster than HTMLImageElement for drawImage
  const bitmapCacheRef = useRef<Map<string, ImageBitmap>>(new Map());
  const scaleRef = useRef<number>(1);
  const rafRef = useRef<number>(0);

  const status = useGameStore((s) => s.status);
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  // Load sprites — falls back to colored shapes if assets are missing
  useEffect(() => {
    const manifest = buildAssetManifest();
    loadAllAssets(manifest).then((cache) => {
      if (cache.size > 0) bitmapCacheRef.current = cache;
    });
  }, []);

  // ─── DPR-ADAPTIVE CANVAS ───────────────────────────────────────────
  // Canvas size adapts to the container accounting for DPR.
  // Logical game space GAME_WIDTH×GAME_HEIGHT is scaled to CSS pixels.
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

  // ─── RENDER LOOP ───────────────────────────────────────────────────
  // Independent RAF for rendering only.
  // Physics updates happen in useGameEngine.
  // When game is idle the render loop still runs, showing the basket.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      markRenderStart();
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

      // Items
      itemsRef.current.forEach((item) => {
        renderItem(ctx, item, bitmapCacheRef.current);
      });

      // Particles from pool
      const particles = getParticlePool();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.age >= p.lifetime) continue;
        renderParticle(ctx, p);
      }

      // Chain line (liana)
      const chain = chainLineRef.current;
      renderChainLine(ctx, chain);

      ctx.restore();

      // Debug overlay (rendered in screen space, after ctx.restore)
      renderDebugOverlay(ctx);
      markRenderEnd();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F3') { e.preventDefault(); toggleDebug(); }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKey);
    };
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

// ─── RENDER FUNCTIONS ───────────────────────────────────────────────

function renderBasket(ctx: CanvasRenderingContext2D) {
  const { leftWall, bottomArc, rightWall } = getBasketOutlinePoints();
  const leftTop = leftWall[0];
  const leftBottom = leftWall[leftWall.length - 1];
  const rightBottom = rightWall[rightWall.length - 1];
  const rightTop = rightWall[0];

  ctx.save();
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = BASKET_WALL_THICKNESS;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(61, 39, 35, 0.18)';
  ctx.shadowBlur = 6;

  ctx.beginPath();
  ctx.moveTo(leftTop.x, leftTop.y - BASKET_RIM_HEIGHT);
  ctx.lineTo(leftTop.x, leftTop.y);
  for (let i = 1; i < leftWall.length; i++) {
    ctx.lineTo(leftWall[i].x, leftWall[i].y);
  }
  ctx.lineTo(leftBottom.x, leftBottom.y);
  for (let i = 1; i < bottomArc.length; i++) {
    ctx.lineTo(bottomArc[i].x, bottomArc[i].y);
  }
  ctx.lineTo(rightBottom.x, rightBottom.y);
  for (let i = rightWall.length - 2; i >= 0; i--) {
    ctx.lineTo(rightWall[i].x, rightWall[i].y);
  }
  ctx.lineTo(rightTop.x, rightTop.y - BASKET_RIM_HEIGHT);
  ctx.stroke();

  // Арка
  const { left: archLeft, right: archRight } = getBasketArchPoints();
  ctx.beginPath();
  ctx.moveTo(archLeft[0].x, archLeft[0].y);
  for (let i = 1; i < archLeft.length; i++) {
    ctx.lineTo(archLeft[i].x, archLeft[i].y);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(archRight[0].x, archRight[0].y);
  for (let i = 1; i < archRight.length; i++) {
    ctx.lineTo(archRight[i].x, archRight[i].y);
  }
  ctx.stroke();

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

  // Shadow glow for selected items
  if (item.isSelected) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 14;
  }

  // Sprite or fallback circle
  const bitmapKey = item.type;
  const bitmap = cache.get(bitmapKey);
  if (bitmap) {
    ctx.drawImage(bitmap, -r, -r, r * 2, r * 2);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = cfg?.color ?? '#888';
    ctx.fill();
    if (item.isGolden) {
      ctx.lineWidth = Math.max(3, r * 0.18);
      ctx.strokeStyle = '#FFD600';
      ctx.stroke();
    }
    // Letter hint
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(r * 0.75)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ITEM_LABELS[baseType] ?? '?', 0, 0);
  }

  ctx.shadowBlur = 0;

  // Golden glow
  if (item.isGolden) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.6);
    glow.addColorStop(0, 'rgba(255, 214, 0, 0)');
    glow.addColorStop(1, 'rgba(255, 214, 0, 0.35)');
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Net overlay
  if (item.netState !== null) {
    const netCfg = NET_CONFIGS[item.netState];
    const netBmp = cache.get(`net_${item.netState}`);
    if (netBmp) {
      ctx.drawImage(netBmp, -r - 4, -r - 4, (r + 4) * 2, (r + 4) * 2);
    } else {
      // Fallback: semi-transparent circle outline
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = netCfg.overlayColor;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }

  // Stone overlay — gray on top
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
      // Durability indicator
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
