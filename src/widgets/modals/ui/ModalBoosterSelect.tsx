'use client';

import { ITEM_CONFIGS } from '@/features/basket-game/config/items';
import type { ItemType } from '@/features/basket-game/model/types';
import styles from './modals.module.scss';

interface ModalBoosterSelectProps {
  availableTypes: ItemType[];
  onSelect: (type: ItemType) => void;
  onCancel: () => void;
}

export default function ModalBoosterSelect({ availableTypes, onSelect, onCancel }: ModalBoosterSelectProps) {
  return (
    <div className={styles.selectOverlay}>
      <div className={styles.selectCard}>
        <div className={styles.emoji}>🌀</div>
        <h3 className={styles.selectTitle}>Блендер</h3>
        <p className={styles.selectSubtitle}>Выбери тип овоща — все такие исчезнут</p>

        <div className={styles.itemGrid}>
          {availableTypes.map((type) => {
            const cfg = ITEM_CONFIGS[type];
            return (
              <button key={type} className={styles.itemBtn} onClick={() => onSelect(type)}>
                <div className={styles.itemCircle} style={{ backgroundColor: cfg.color }}>
                  {cfg.label.charAt(0)}
                </div>
                <span className={styles.itemName}>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        <button className={styles.btnSecondary} onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
