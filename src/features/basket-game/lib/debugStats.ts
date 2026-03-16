import { MAX_PARTICLES } from '../config/constants';

export interface DebugStats {
  physicsFrameMs: number;
  renderFrameMs: number;
  avgRenderMs: number;
  fps: number;
  entityCount: number;
  aliveParticles: number;
  particlePoolPct: number;
}

const MAX_SAMPLES = 60;

let enabled = false;
let physicsStart = 0;
let renderStart = 0;
const renderSamples: number[] = [];

const stats: DebugStats = {
  physicsFrameMs: 0,
  renderFrameMs: 0,
  avgRenderMs: 0,
  fps: 0,
  entityCount: 0,
  aliveParticles: 0,
  particlePoolPct: 0,
};

export function toggleDebug(): boolean {
  enabled = !enabled;
  if (!enabled) renderSamples.length = 0;
  return enabled;
}

export function isDebugEnabled(): boolean {
  return enabled;
}

// Physics timing
export function markPhysicsStart(): void {
  if (enabled) physicsStart = performance.now();
}

export function markPhysicsEnd(): void {
  if (enabled) stats.physicsFrameMs = performance.now() - physicsStart;
}

// Render timing
export function markRenderStart(): void {
  if (enabled) renderStart = performance.now();
}

export function markRenderEnd(): void {
  if (!enabled) return;
  const dt = performance.now() - renderStart;
  stats.renderFrameMs = dt;
  renderSamples.push(dt);
  if (renderSamples.length > MAX_SAMPLES) renderSamples.shift();
  const sum = renderSamples.reduce((a, b) => a + b, 0);
  stats.avgRenderMs = sum / renderSamples.length;
  stats.fps = stats.avgRenderMs > 0 ? 1000 / stats.avgRenderMs : 0;
}

// Entity counts
export function updateDebugCounts(entityCount: number, aliveParticles: number): void {
  if (!enabled) return;
  stats.entityCount = entityCount;
  stats.aliveParticles = aliveParticles;
  stats.particlePoolPct = (aliveParticles / MAX_PARTICLES) * 100;
}

export function getDebugStats(): Readonly<DebugStats> {
  return stats;
}

// Render overlay on canvas (top-right corner)
export function renderDebugOverlay(ctx: CanvasRenderingContext2D): void {
  if (!enabled) return;

  const lines = [
    `FPS: ${stats.fps.toFixed(0)}`,
    `Render: ${stats.renderFrameMs.toFixed(1)}ms (avg ${stats.avgRenderMs.toFixed(1)}ms)`,
    `Physics: ${stats.physicsFrameMs.toFixed(1)}ms`,
    `Entities: ${stats.entityCount}`,
    `Particles: ${stats.aliveParticles}/${MAX_PARTICLES} (${stats.particlePoolPct.toFixed(0)}%)`,
  ];

  const lineHeight = 14;
  const padding = 6;
  const boxW = 200;
  const boxH = lines.length * lineHeight + padding * 2;
  const boxX = ctx.canvas.width / (window.devicePixelRatio || 1) - boxW - 8;
  const boxY = 8;

  ctx.save();
  ctx.resetTransform();
  const dpr = window.devicePixelRatio || 1;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = '#0f0';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], boxX + padding, boxY + padding + i * lineHeight);
  }

  ctx.restore();
}
