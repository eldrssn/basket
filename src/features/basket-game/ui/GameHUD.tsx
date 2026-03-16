'use client';

import { Droplets, Scissors, Blend } from 'lucide-react';
import { useGameStore } from '../model/useGameStore';
import type { BoosterType } from '../model/types';
import { BOOSTER_CONFIGS } from '../config/boosters';
import styles from './GameHUD.module.scss';

interface GameHUDProps {
  onBoosterClick: (type: BoosterType) => void;
}

const BOOSTER_ICONS: Record<BoosterType, React.ReactNode> = {
  watering: <Droplets size={24} />,
  skewer: <Scissors size={24} />,
  blender: <Blend size={24} />,
};

const BOOSTER_ORDER: BoosterType[] = ['watering', 'skewer', 'blender'];

export default function GameHUD({ onBoosterClick }: GameHUDProps) {
  const {
    score,
    movesLeft,
    harvestProgress,
    harvestGoal,
    boosters,
    status,
    activeBooster,
  } = useGameStore();

  const progressPct =
    harvestGoal > 0 ? Math.min(100, (harvestProgress / harvestGoal) * 100) : 0;
  const isLowMoves = movesLeft <= 3 && movesLeft > 0;

  return (
    <>
      {/* ── Top panel ── */}
      <div className={styles.topPanel}>
        <div className={styles.stats}>
          <div
            className={`${styles.stat} ${isLowMoves ? styles.movesWarning : ''}`}
          >
            <span className={styles.icon}>🌿</span>
            <span className={styles.value}>Ходы: {movesLeft}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.icon}>★</span>
            <span className={styles.value}>Очки: {score}</span>
          </div>
        </div>

        <div className={styles.harvestBar}>
          <div className={styles.progressContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {score} / {harvestGoal}
          </span>
        </div>
      </div>

      {/* ── Bottom panel: 3 boosters ── */}
      <div className={styles.bottomPanel}>
        {BOOSTER_ORDER.map((type) => {
          const count = boosters[type];
          const isActive =
            status === 'booster_mode' && activeBooster.type === type;
          const isDisabled = count <= 0 || (status !== 'playing' && !isActive);

          return (
            <button
              key={type}
              className={`${styles.boosterBtn} ${isActive ? styles.boosterActive : ''} ${isDisabled ? styles.boosterDisabled : ''}`}
              onClick={() => !isDisabled && onBoosterClick(type)}
              title={BOOSTER_CONFIGS[type].label}
              disabled={isDisabled}
            >
              {BOOSTER_ICONS[type]}
              {count > 0 && <span className={styles.badge}>{count}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}
