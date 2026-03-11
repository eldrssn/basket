'use client';

import { BOOSTER_CONFIGS } from '@/features/basket-game/config/boosters';
import type { BoosterType } from '@/features/basket-game/model/types';
import styles from './modals.module.scss';

interface ModalBoosterHintProps {
  boosterType: BoosterType;
  onCancel: () => void;
}

const EMOJI: Record<BoosterType, string> = {
  watering: '💧',
  skewer: '🗡️',
  blender: '🌀',
};

export default function ModalBoosterHint({ boosterType, onCancel }: ModalBoosterHintProps) {
  const cfg = BOOSTER_CONFIGS[boosterType];

  return (
    <div className={styles.hintOverlay}>
      <div className={styles.hintPanel}>
        <div className={styles.hintHeader}>
          <div className={styles.hintEmoji}>{EMOJI[boosterType]}</div>
          <div>
            <div className={styles.hintLabel}>{cfg.label}</div>
            <div className={styles.hintDesc}>{cfg.description}</div>
          </div>
        </div>
        <div className={styles.hintNote}>Тапни по нужному объекту на поле</div>
        <button className={styles.btnSecondary} onClick={onCancel}>
          Отмена — бустер не тратится
        </button>
      </div>
    </div>
  );
}
