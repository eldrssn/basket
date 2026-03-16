import { ITEM_CONFIGS, ALL_ITEM_TYPES } from '../config/items';
import { NET_CONFIGS } from '../config/blockers';
import { STONE_CONFIGS } from '../config/blockers';
import type { ItemType, NetState, StoneSize } from '../model/types';

export interface AssetManifestEntry {
  key: string;
  src: string;
}

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  failed: string[];
}

export type ProgressCallback = (progress: AssetLoadProgress) => void;

// Build manifest from config — single source of truth for asset paths
export function buildAssetManifest(): AssetManifestEntry[] {
  const entries: AssetManifestEntry[] = [];

  for (const type of ALL_ITEM_TYPES) {
    const cfg = ITEM_CONFIGS[type];
    entries.push({ key: type, src: cfg.spriteSrc });
    entries.push({ key: `golden_${type}`, src: cfg.spriteSrc });
  }

  for (const state of Object.keys(NET_CONFIGS) as NetState[]) {
    entries.push({ key: `net_${state}`, src: NET_CONFIGS[state].spriteOverlay });
  }

  for (const size of Object.keys(STONE_CONFIGS) as StoneSize[]) {
    entries.push({ key: `stone_${size}`, src: STONE_CONFIGS[size].spriteSrc });
  }

  return entries;
}

// Load all assets, reporting progress. Returns cache of successfully loaded bitmaps.
// Assets that fail to load are silently skipped — rendering falls back to colored shapes.
export async function loadAllAssets(
  manifest: AssetManifestEntry[],
  onProgress?: ProgressCallback,
): Promise<Map<string, ImageBitmap>> {
  const cache = new Map<string, ImageBitmap>();
  const progress: AssetLoadProgress = { loaded: 0, total: manifest.length, failed: [] };

  const tasks = manifest.map(async (entry) => {
    try {
      const resp = await fetch(entry.src);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const bitmap = await createImageBitmap(blob);
      cache.set(entry.key, bitmap);
    } catch {
      progress.failed.push(entry.key);
    } finally {
      progress.loaded++;
      onProgress?.({ ...progress, failed: [...progress.failed] });
    }
  });

  await Promise.allSettled(tasks);
  return cache;
}
