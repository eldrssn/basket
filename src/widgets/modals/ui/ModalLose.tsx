'use client';

import { useGameStore } from '@/features/basket-game/model/useGameStore';
import styles from './modals.module.scss';

interface ModalLoseProps {
  onReplay: () => void;
  onBack: () => void;
}

export default function ModalLose({ onReplay, onBack }: ModalLoseProps) {
  const { score, harvestProgress, harvestGoal } = useGameStore();
  const progressPct = harvestGoal > 0 ? Math.min(100, (harvestProgress / harvestGoal) * 100) : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.emoji}>😔</div>
        <h2 className={styles.titleLose}>Ходы закончились</h2>
        <p className={styles.subtitle}>Цель не выполнена</p>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>Прогресс</span>
            <span>{Math.floor(progressPct)}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <div className={styles.progressNote}>Очков: {score}</div>
        </div>

        <div className={styles.buttons}>
          <button className={styles.btnPrimaryRed} onClick={onReplay}>
            Переиграть
          </button>
          <button className={styles.btnSecondary} onClick={onBack}>
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}
