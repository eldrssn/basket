'use client';

import { useGameStore } from '@/features/basket-game/model/useGameStore';
import styles from './modals.module.scss';

interface ModalWinProps {
  levelName: string;
  onNextLevel: () => void;
  onReplay: () => void;
}

export default function ModalWin({ levelName, onNextLevel, onReplay }: ModalWinProps) {
  const { score } = useGameStore();

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.emoji}>🌿</div>
        <h2 className={styles.titleWin}>Урожай собран!</h2>
        <p className={styles.subtitle}>{levelName}</p>

        <div className={styles.scoreBox}>
          <div className={styles.scoreValue}>{score}</div>
          <div className={styles.scoreLabel}>очков</div>
        </div>

        <div className={styles.buttons}>
          <button className={styles.btnPrimary} onClick={onNextLevel}>
            Следующий уровень →
          </button>
          <button className={styles.btnSecondary} onClick={onReplay}>
            Переиграть
          </button>
        </div>
      </div>
    </div>
  );
}
