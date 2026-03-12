import { useCallback } from 'react';
import Matter from 'matter-js';
import type { LevelConfig } from '../config/levels';
import type { GameItem, FieldItemType, ItemType } from './types';
import { ITEM_CONFIGS } from '../config/items';
import { STONE_CONFIGS } from '../config/blockers';
import { BASKET_TOP_Y, getBasketInnerBoundsAtY } from '../lib/basket';

const SPAWN_PADDING = 40; // extra inset from each wall

export function useSpawner(
  levelConfig: LevelConfig,
  engineRef: React.MutableRefObject<Matter.Engine | null>,
  itemsRef: React.MutableRefObject<Map<string, GameItem>>,
) {
  // Spawn a single random item at the given position (or random X if not specified)
  const spawnItem = useCallback(
    (x?: number, y?: number): GameItem | null => {
      if (!engineRef.current) return null;

      const types = levelConfig.availableTypes;
      const weights = levelConfig.spawnWeights;
      const selectedType = weightedRandom(types, weights);

      const isGolden = Math.random() < levelConfig.goldenSpawnChance;
      const fieldType: FieldItemType = isGolden ? `golden_${selectedType}` : selectedType;

      const cfg = ITEM_CONFIGS[selectedType];
      const spawnBounds = getBasketInnerBoundsAtY(BASKET_TOP_Y, SPAWN_PADDING + cfg.radius);
      const spawnWidth = Math.max(0, spawnBounds.right - spawnBounds.left);
      const spawnX = x ?? spawnBounds.left + Math.random() * spawnWidth;
      const spawnY = y ?? -cfg.radius - 10;

      const body = Matter.Bodies.circle(spawnX, spawnY, cfg.radius, {
        restitution: cfg.restitution,
        friction: cfg.friction,
        frictionAir: cfg.frictionAir,
        mass: cfg.mass,
        label: 'item',
      });

      const item: GameItem = {
        id: String(body.id),
        body,
        type: fieldType,
        netState: null,
        stoneSize: null,
        stoneHitsLeft: 0,
        isGolden,
        isSelected: false,
      };

      Matter.World.add(engineRef.current.world, body);
      itemsRef.current.set(item.id, item);
      return item;
    },
    [levelConfig, engineRef, itemsRef],
  );

  // Spawn initial items to fill the basket at game start
  // totalItems = total count from config; presetItems/blockers already placed before this call
  const spawnInitialItems = useCallback(
    (alreadyPlaced: number) => {
      const remaining = Math.max(0, levelConfig.totalItems - alreadyPlaced);
      for (let i = 0; i < remaining; i++) {
        const cfg = ITEM_CONFIGS[levelConfig.availableTypes[0]];
        const spawnBounds = getBasketInnerBoundsAtY(BASKET_TOP_Y, SPAWN_PADDING + cfg.radius);
        const x = spawnBounds.left + Math.random() * Math.max(0, spawnBounds.right - spawnBounds.left);
        const y = -10 - Math.random() * 300;
        spawnItem(x, y);
      }
    },
    [levelConfig, spawnItem],
  );

  // Respawn exactly `count` items after a match (they fall from above)
  const respawnAfterMatch = useCallback(
    (count: number) => {
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          spawnItem();
        }, i * 120);
      }
    },
    [spawnItem],
  );

  // Spawn a stone body
  const spawnStone = useCallback(
    (size: import('./types').StoneSize, x: number, y: number) => {
      if (!engineRef.current) return;
      const stoneCfg = STONE_CONFIGS[size];
      const body = Matter.Bodies.circle(x, y, stoneCfg.radius, {
        mass: stoneCfg.mass,
        friction: 0.8,
        restitution: 0.1,
        frictionAir: 0.02,
        label: 'stone',
      });
      const item: GameItem = {
        id: String(body.id),
        body,
        type: 'tomato', // type irrelevant for stones
        netState: null,
        stoneSize: size,
        stoneHitsLeft: stoneCfg.hitsToDestroy,
        isGolden: false,
        isSelected: false,
      };
      Matter.World.add(engineRef.current.world, body);
      itemsRef.current.set(item.id, item);
    },
    [engineRef, itemsRef],
  );

  return { spawnItem, spawnInitialItems, respawnAfterMatch, spawnStone };
}

function weightedRandom(
  types: ItemType[],
  weights: Partial<Record<ItemType, number>>,
): ItemType {
  const total = types.reduce((s, t) => s + (weights[t] ?? 1), 0);
  let rand = Math.random() * total;
  for (const t of types) {
    rand -= weights[t] ?? 1;
    if (rand <= 0) return t;
  }
  return types[0];
}
