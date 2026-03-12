'use client';

import { useState, useCallback } from 'react';
import { useGameEngine } from '@/features/basket-game/model/useGameEngine';
import { useMatchLogic } from '@/features/basket-game/model/useMatchLogic';
import { useGameStore } from '@/features/basket-game/model/useGameStore';
import GameCanvas from '@/features/basket-game/ui/GameCanvas';
import GameHUD from '@/features/basket-game/ui/GameHUD';
import ModalWin from '@/widgets/modals/ui/ModalWin';
import ModalLose from '@/widgets/modals/ui/ModalLose';
import ModalBoosterHint from '@/widgets/modals/ui/ModalBoosterHint';
import ModalBoosterSelect from '@/widgets/modals/ui/ModalBoosterSelect';
import { generateLevel } from '@/features/basket-game/config/levels';
import type { LevelConfig } from '@/features/basket-game/config/levels';
import type { BoosterType, ItemType } from '@/features/basket-game/model/types';
import { ITEM_CONFIGS, ALL_ITEM_TYPES } from '@/features/basket-game/config/items';
import styles from './home.module.scss';

const DEFAULT_LEVEL = generateLevel(1);

export default function Home() {
  const [config, setConfig] = useState<LevelConfig>(DEFAULT_LEVEL);
  const [draftConfig, setDraftConfig] = useState<LevelConfig>(DEFAULT_LEVEL);
  const [selectedTypes, setSelectedTypes] = useState<Set<ItemType>>(
    new Set(DEFAULT_LEVEL.availableTypes),
  );

  const { itemsRef, initGame, destroyChain, activateBoosterMode, cancelBooster, applyBooster } =
    useGameEngine(config);

  const { status, activeBooster } = useGameStore();
  const { chainLineRef, handlers } = useMatchLogic(itemsRef, destroyChain);

  const handleBoosterClick = useCallback(
    (type: BoosterType) => {
      if (status === 'booster_mode' && activeBooster.type === type) {
        cancelBooster();
      } else {
        activateBoosterMode(type);
      }
    },
    [status, activeBooster, activateBoosterMode, cancelBooster],
  );

  const handleCanvasPointerDown = useCallback(
    (x: number, y: number) => {
      if (status === 'booster_mode' && activeBooster.type) {
        if (activeBooster.type === 'blender') return;
        for (const item of itemsRef.current.values()) {
          const dx = x - item.body.position.x;
          const dy = y - item.body.position.y;
          const r = item.body.circleRadius ?? 0;
          if (dx * dx + dy * dy <= r * r) {
            applyBooster(activeBooster.type, item.id);
            return;
          }
        }
        cancelBooster();
        return;
      }
      handlers.handlePointerDown(x, y);
    },
    [status, activeBooster, itemsRef, applyBooster, cancelBooster, handlers],
  );

  const handleApply = useCallback(() => {
    const newConfig: LevelConfig = {
      ...draftConfig,
      availableTypes: Array.from(selectedTypes),
      spawnWeights: Object.fromEntries(Array.from(selectedTypes).map((t) => [t, 1])),
    };
    setConfig(newConfig);
    setTimeout(initGame, 50);
  }, [draftConfig, selectedTypes, initGame]);

  const handleBlenderSelect = useCallback(
    (type: ItemType) => { applyBooster('blender', type); },
    [applyBooster],
  );

  const toggleType = (type: ItemType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div className={styles.container}>
      {/* LEFT: Конфигуратор */}
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>Конструктор уровня</h1>

        {/* Предметы */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Предметы</h2>
          <div className={styles.grid4}>
            {ALL_ITEM_TYPES.map((type) => {
              const cfg = ITEM_CONFIGS[type];
              const selected = selectedTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`${styles.vegButton} ${selected ? styles.selected : ''}`}
                >
                  <div className={styles.vegIcon} style={{ backgroundColor: cfg.color }}>
                    {cfg.label.charAt(0)}
                  </div>
                  <span className={styles.vegLabel}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Правила */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Правила</h2>
          <div className={styles.inputGroup}>
            <label>Всего предметов в корзине</label>
            <input
              type="text"
              inputMode="numeric"
              value={draftConfig.totalItems}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setDraftConfig((c) => ({ ...c, totalItems: val === '' ? 0 : parseInt(val) }));
              }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Лимит ходов</label>
            <input
              type="text"
              inputMode="numeric"
              value={draftConfig.movesLimit}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setDraftConfig((c) => ({ ...c, movesLimit: val === '' ? 0 : parseInt(val) }));
              }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Цель (очки)</label>
            <input
              type="text"
              inputMode="numeric"
              value={draftConfig.harvestGoalPoints}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setDraftConfig((c) => ({ ...c, harvestGoalPoints: val === '' ? 0 : parseInt(val) }));
              }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Шанс золотого (0–1)</label>
            <input
              type="text"
              inputMode="decimal"
              value={draftConfig.goldenSpawnChance}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d*$/.test(val)) {
                  setDraftConfig((c) => ({
                    ...c,
                    goldenSpawnChance: val === '' ? 0 : parseFloat(val),
                  }));
                }
              }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Вероятность блокеров при досыпке (0–1)</label>
            <input
              type="text"
              inputMode="decimal"
              value={draftConfig.blockerSpawnChance}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d*$/.test(val)) {
                  setDraftConfig((c) => ({
                    ...c,
                    blockerSpawnChance: val === '' ? 0 : parseFloat(val),
                  }));
                }
              }}
            />
          </div>
        </section>

        {/* Бустеры */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Бустеры (стартовое кол-во)</h2>
          <div className={styles.inputGroup}>
            <label>Лейка (0–100)</label>
            <input
              type="text"
              inputMode="numeric"
              value={draftConfig.startBoosters.watering ?? 0}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                const n = Math.min(100, val === '' ? 0 : parseInt(val));
                setDraftConfig((c) => ({
                  ...c,
                  startBoosters: { ...c.startBoosters, watering: n },
                }));
              }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Шампур (0–100)</label>
            <input
              type="text"
              inputMode="numeric"
              value={draftConfig.startBoosters.skewer ?? 0}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                const n = Math.min(100, val === '' ? 0 : parseInt(val));
                setDraftConfig((c) => ({
                  ...c,
                  startBoosters: { ...c.startBoosters, skewer: n },
                }));
              }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Блендер (0–100)</label>
            <input
              type="text"
              inputMode="numeric"
              value={draftConfig.startBoosters.blender ?? 0}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                const n = Math.min(100, val === '' ? 0 : parseInt(val));
                setDraftConfig((c) => ({
                  ...c,
                  startBoosters: { ...c.startBoosters, blender: n },
                }));
              }}
            />
          </div>
        </section>

        <button onClick={handleApply} className={styles.applyButton}>
          Применить и перезапустить
        </button>

        {/* JSON */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Конфиг JSON</h2>
          <textarea
            readOnly
            value={JSON.stringify(config, null, 2)}
            className={styles.jsonArea}
          />
        </section>
      </div>

      {/* RIGHT: Игра */}
      <div className={styles.rightPanel}>
        <div className={styles.gameWrapper}>
          <GameCanvas
            itemsRef={itemsRef}
            chainLineRef={chainLineRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handlers.handlePointerMove}
            onPointerUp={handlers.handlePointerUp}
          />

          <GameHUD onBoosterClick={handleBoosterClick} />

          {status === 'booster_mode' && activeBooster.type && activeBooster.type !== 'blender' && (
            <ModalBoosterHint boosterType={activeBooster.type} onCancel={cancelBooster} />
          )}

          {status === 'booster_mode' && activeBooster.type === 'blender' && (
            <ModalBoosterSelect
              availableTypes={config.availableTypes}
              onSelect={handleBlenderSelect}
              onCancel={cancelBooster}
            />
          )}

          {status === 'win' && (
            <ModalWin
              levelName={config.name}
              onNextLevel={handleApply}
              onReplay={() => setTimeout(initGame, 50)}
            />
          )}

          {status === 'lose' && (
            <ModalLose
              onReplay={() => setTimeout(initGame, 50)}
              onBack={handleApply}
            />
          )}
        </div>
      </div>
    </div>
  );
}
