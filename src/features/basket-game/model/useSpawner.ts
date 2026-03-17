import { useCallback, useRef } from 'react';
import Matter from 'matter-js';
import type { LevelConfig } from '../config/levels';
import type { GameItem, FieldItemType, ItemType, NetState, StoneSize } from './types';
import { ITEM_CONFIGS } from '../config/items';
import { STONE_CONFIGS } from '../config/blockers';
import { BASKET_TOP_Y, getBasketInnerBoundsAtY } from '../lib/basket';
import { SPAWN_PADDING, RESPAWN_STAGGER_MS, INITIAL_SPAWN_STAGGER_MS } from '../config/constants';

export function useSpawner(
  levelConfig: LevelConfig,
  engineRef: React.MutableRefObject<Matter.Engine | null>,
  itemsRef: React.MutableRefObject<Map<string, GameItem>>,
) {
  const initialSpawnTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const getSpawnPosition = useCallback(
    (radius: number, x?: number, y?: number) => {
      const spawnBounds = getBasketInnerBoundsAtY(BASKET_TOP_Y, SPAWN_PADDING + radius);
      const spawnWidth = Math.max(0, spawnBounds.right - spawnBounds.left) * 0.25;
      const spawnCenter = (spawnBounds.left + spawnBounds.right) / 2;

      return {
        x: x ?? spawnCenter - spawnWidth / 2 + Math.random() * spawnWidth,
        y: y ?? -radius - 10,
      };
    },
    [],
  );

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
      const spawnPoint = getSpawnPosition(cfg.radius, x, y);

      const body = Matter.Bodies.circle(spawnPoint.x, spawnPoint.y, cfg.radius, {
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
    [engineRef, getSpawnPosition, itemsRef, levelConfig],
  );

  const spawnNetItem = useCallback(
    (wrapsType: ItemType, initialState: NetState, x?: number, y?: number): GameItem | null => {
      if (!engineRef.current) return null;

      const cfg = ITEM_CONFIGS[wrapsType];
      const spawnPoint = getSpawnPosition(cfg.radius, x, y);
      const body = Matter.Bodies.circle(spawnPoint.x, spawnPoint.y, cfg.radius, {
        restitution: cfg.restitution,
        friction: cfg.friction,
        frictionAir: cfg.frictionAir,
        mass: cfg.mass,
        label: 'item',
      });

      const item: GameItem = {
        id: String(body.id),
        body,
        type: wrapsType,
        netState: initialState,
        stoneSize: null,
        stoneHitsLeft: 0,
        isGolden: false,
        isSelected: false,
      };

      Matter.World.add(engineRef.current.world, body);
      itemsRef.current.set(item.id, item);
      return item;
    },
    [engineRef, getSpawnPosition, itemsRef],
  );

  // Spawn initial items to fill the basket at game start
  // totalItems = total count from config; presetItems/blockers already placed before this call
  const spawnInitialItems = useCallback(
    (alreadyPlaced: number) => {
      initialSpawnTimersRef.current.forEach(clearTimeout);
      initialSpawnTimersRef.current = [];

      const remaining = Math.max(0, levelConfig.totalItems - alreadyPlaced);
      for (let i = 0; i < remaining; i++) {
        const timer = setTimeout(() => {
          const cfg = ITEM_CONFIGS[levelConfig.availableTypes[0]];
          const spawnBounds = getBasketInnerBoundsAtY(BASKET_TOP_Y, SPAWN_PADDING + cfg.radius);
          const spawnWidth = Math.max(0, spawnBounds.right - spawnBounds.left) * 0.25;
          const spawnCenter = (spawnBounds.left + spawnBounds.right) / 2;
          const x = spawnCenter - spawnWidth / 2 + Math.random() * spawnWidth;
          const y = -10 - Math.random() * 300;
          spawnItem(x, y);
        }, i * INITIAL_SPAWN_STAGGER_MS);
        initialSpawnTimersRef.current.push(timer);
      }
    },
    [levelConfig, spawnItem],
  );

  // Spawn a stone body
  const spawnStone = useCallback(
    (size: StoneSize, x?: number, y?: number) => {
      if (!engineRef.current) return;
      const stoneCfg = STONE_CONFIGS[size];
      const spawnPoint = getSpawnPosition(stoneCfg.radius, x, y);
      const body = Matter.Bodies.circle(spawnPoint.x, spawnPoint.y, stoneCfg.radius, {
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
    [engineRef, getSpawnPosition, itemsRef],
  );

  // Respawn exactly `count` items after a match (they fall from above)
  const respawnAfterMatch = useCallback(
    (count: number) => {
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const blockerSpawnChance = clampProbability(levelConfig.blockerSpawnChance);
          const shouldSpawnBlocker = Math.random() < blockerSpawnChance;

          if (shouldSpawnBlocker) {
            const blockerOptions: Array<
              | { kind: 'net'; wrapsType: ItemType; initialState: NetState }
              | { kind: 'stone'; size: StoneSize }
            > = [];

            for (const blocker of levelConfig.netBlockers) {
              blockerOptions.push({
                kind: 'net',
                wrapsType: blocker.wrapsType,
                initialState: blocker.initialState,
              });
            }

            for (const blocker of levelConfig.stoneBlockers) {
              blockerOptions.push({
                kind: 'stone',
                size: blocker.size,
              });
            }

            if (blockerOptions.length > 0) {
              const selected = blockerOptions[Math.floor(Math.random() * blockerOptions.length)];
              if (selected.kind === 'net') {
                spawnNetItem(selected.wrapsType, selected.initialState);
                return;
              }

              spawnStone(selected.size);
              return;
            }
          }

          spawnItem();
        }, i * RESPAWN_STAGGER_MS);
      }
    },
    [
      levelConfig.blockerSpawnChance,
      levelConfig.netBlockers,
      levelConfig.stoneBlockers,
      spawnItem,
      spawnNetItem,
      spawnStone,
    ],
  );

  return { spawnItem, spawnInitialItems, respawnAfterMatch, spawnStone };
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
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
