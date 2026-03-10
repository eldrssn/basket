'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameEngine } from '@/features/basket-game/model/useGameEngine';
import { useMatchLogic } from '@/features/basket-game/model/useMatchLogic';
import GameCanvas from '@/features/basket-game/ui/GameCanvas';
import GameHUD from '@/features/basket-game/ui/GameHUD';
import { LevelConfig } from '@/features/basket-game/config/levels';
import {
  VegetableType,
  VEGETABLE_LABELS,
  VEGETABLE_CONFIGS,
  VEGETABLE_NAMES_RU,
} from '@/features/basket-game/config/vegetables';
import { BoosterType } from '@/features/basket-game/model/types';
import styles from './home.module.scss'; // Using the new SCSS module

// Default config
const DEFAULT_CONFIG: LevelConfig = {
  id: 1,
  name: 'Custom Level',
  harvestGoal: 500, // Points needed
  movesLimit: 20,
  spawnInterval: 800,
  vegetableTypes: ['tomato', 'cucumber', 'pepper', 'eggplant', 'onion'],
  spawnWeights: {
    tomato: 1,
    cucumber: 1,
    pepper: 1,
    eggplant: 1,
    onion: 1,
    carrot: 1,
    beetroot: 1,
    apple: 1,
    orange: 1,
    strawberry: 1,
    blueberry: 1,
    watermelon: 1,
    pumpkin: 1,
    golden_tomato: 1,
    golden_cucumber: 1,
  },
  goldenChance: 0.05,
  maxVegetables: 45,
  blockers: {
    watermelonEnabled: false,
    pumpkinEnabled: false,
    iceEnabled: false,
    iceChance: 0.1,
    stonesEnabled: false,
    stoneChance: 0.1,
    initialBlockers: [],
  },
  preFilledVegetables: [],
  availableBoosters: ['blender', 'skewer', 'watering', 'rake'],
  startBoosters: { blender: 1, skewer: 1, watering: 1, rake: 1 },
  zone: 'garden',
  backgroundVariant: 1,
};

const ALL_VEGETABLES: VegetableType[] = [
  'tomato',
  'cucumber',
  'pepper',
  'eggplant',
  'onion',
  'carrot',
  'beetroot',
  'apple',
  'orange',
  'strawberry',
  'blueberry',
];

export default function Home() {
  const [config, setConfig] = useState<LevelConfig>(DEFAULT_CONFIG);
  const [gameKey, setGameKey] = useState(0);
  const [selectedVegs, setSelectedVegs] = useState<Set<VegetableType>>(
    new Set(DEFAULT_CONFIG.vegetableTypes),
  );

  const {
    canvasRef,
    gameState,
    vegetablesRef,
    particlesRef,
    initGame,
    destroyChain,
    activateBooster,
  } = useGameEngine(config);

  const { handlers, chainLineRef } = useMatchLogic(
    vegetablesRef.current,
    destroyChain,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      initGame();
    }, 100);
    return () => clearTimeout(timer);
  }, [gameKey, initGame]);

  const handleRestart = () => {
    const newConfig = {
      ...config,
      vegetableTypes: Array.from(selectedVegs),
    };
    setConfig(newConfig);
    setGameKey((prev) => prev + 1);
  };

  const toggleVeg = (type: VegetableType) => {
    const newSet = new Set(selectedVegs);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedVegs(newSet);
  };

  return (
    <div className={styles.container}>
      {/* LEFT PANEL: Settings */}
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>Настройки игры</h1>

        {/* 1. Vegetables */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Овощи</h2>
          <div className={styles.grid4}>
            {ALL_VEGETABLES.map((type) => {
              const vegConfig = VEGETABLE_CONFIGS[type];
              const isSelected = selectedVegs.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleVeg(type)}
                  className={`${styles.vegButton} ${isSelected ? styles.selected : ''}`}
                >
                  <div
                    className={styles.vegIcon}
                    style={{ backgroundColor: vegConfig.color }}
                  >
                    {VEGETABLE_LABELS[type]}
                  </div>
                  <span className={styles.vegLabel}>
                    {VEGETABLE_NAMES_RU[type] || type}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Blockers */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Блокеры (Вероятность)</h2>
          <div className="space-y-3">
            {/* Net (Ice) */}
            <div className={styles.blockerRow}>
              <div className={styles.blockerInfo}>
                <span>Сетка (Лёд)</span>
                <p>Связывает предмет, снимается матчем</p>
              </div>
              <div className="flex items-center gap-4">
                {config.blockers.iceEnabled && (
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.blockers.iceChance}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        blockers: {
                          ...config.blockers,
                          iceChance: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className={styles.probInput}
                  />
                )}
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={config.blockers.iceEnabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        blockers: {
                          ...config.blockers,
                          iceEnabled: e.target.checked,
                        },
                      })
                    }
                    className={styles.toggleInput}
                  />
                  <div className={styles.toggleSwitch}></div>
                </label>
              </div>
            </div>

            {/* Stone */}
            <div className={styles.blockerRow}>
              <div className={styles.blockerInfo}>
                <span>Камень</span>
                <p>Тяжелый, нужен бустер или матч рядом</p>
              </div>
              <div className="flex items-center gap-4">
                {config.blockers.stonesEnabled && (
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.blockers.stoneChance}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        blockers: {
                          ...config.blockers,
                          stoneChance: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className={styles.probInput}
                  />
                )}
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={config.blockers.stonesEnabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        blockers: {
                          ...config.blockers,
                          stonesEnabled: e.target.checked,
                        },
                      })
                    }
                    className={styles.toggleInput}
                  />
                  <div className={styles.toggleSwitch}></div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Game Rules */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Правила</h2>
          <div className="space-y-4">
            <div className={styles.inputGroup}>
              <label>Лимит ходов</label>
              <input
                type="text"
                inputMode="numeric"
                value={config.movesLimit}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setConfig({
                    ...config,
                    movesLimit: val === '' ? 0 : parseInt(val),
                  });
                }}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Цель (Очки)</label>
              <input
                type="text"
                inputMode="numeric"
                value={config.harvestGoal}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setConfig({
                    ...config,
                    harvestGoal: val === '' ? 0 : parseInt(val),
                  });
                }}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Шанс золотого (0-1)</label>
              <input
                type="text"
                inputMode="decimal"
                value={config.goldenChance}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) {
                    setConfig({
                      ...config,
                      goldenChance: val === '' ? 0 : parseFloat(val),
                    });
                  }
                }}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Макс. предметов на поле</label>
              <input
                type="text"
                inputMode="numeric"
                value={config.maxVegetables}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setConfig({
                    ...config,
                    maxVegetables: val === '' ? 45 : parseInt(val),
                  });
                }}
              />
            </div>
          </div>
        </section>

        <button onClick={handleRestart} className={styles.applyButton}>
          Применить и перезапустить
        </button>

        {/* JSON Config */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Конфиг JSON</h2>
          <textarea
            readOnly
            value={JSON.stringify(config, null, 2)}
            className={styles.jsonArea}
          />
        </section>
      </div>

      {/* RIGHT PANEL: Game */}
      <div className={styles.rightPanel}>
        <div className={styles.gameWrapper}>
          <GameHUD gameState={gameState} onBoosterClick={activateBooster} />

          <GameCanvas
            canvasRef={canvasRef}
            vegetablesRef={vegetablesRef}
            particlesRef={particlesRef}
            chainLineRef={chainLineRef}
            width={360}
            height={640}
            onPointerDown={handlers.handlePointerDown}
            onPointerMove={handlers.handlePointerMove}
            onPointerUp={handlers.handlePointerUp}
          />

          {/* Overlays */}
          {gameState.status === 'win' && (
            <div className={styles.overlay}>
              <div className={styles.overlayContent}>
                <h2 className={styles.winText}>Level Complete!</h2>
                <p>
                  Score: {gameState.score} / {config.harvestGoal}
                </p>
                <button onClick={handleRestart} className={styles.winBtn}>
                  Play Again
                </button>
              </div>
            </div>
          )}

          {gameState.status === 'lose_moves' && (
            <div className={styles.overlay}>
              <div className={styles.overlayContent}>
                <h2 className={styles.loseText}>Out of Moves</h2>
                <p>Try again?</p>
                <button onClick={handleRestart} className={styles.loseBtn}>
                  Restart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
