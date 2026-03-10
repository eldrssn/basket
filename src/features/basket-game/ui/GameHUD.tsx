import { GameState } from '../model/types';
import styles from './GameHUD.module.scss';
import { RefreshCw, Zap, Droplets, Grid, Scissors, Plus } from 'lucide-react';

interface GameHUDProps {
  gameState: GameState;
  onBoosterClick: (type: any) => void;
}

export default function GameHUD({ gameState, onBoosterClick }: GameHUDProps) {
  const { score, movesLeft, harvestProgress, harvestGoal, boosters } = gameState;

  return (
    <>
      <div className={styles.topPanel}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.icon}>🌿</span>
            <span className={styles.value}>{movesLeft}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.icon}>★</span>
            <span className={styles.value}>{score}</span>
          </div>
        </div>
        
        <div className={styles.harvestBar}>
          <div className={styles.progressContainer}>
             <div 
               className={styles.progressBar} 
               style={{ width: `${Math.min(100, (harvestProgress / harvestGoal) * 100)}%` }}
             />
          </div>
          <span className={styles.progressText}>{Math.floor((harvestProgress / harvestGoal) * 100)}%</span>
        </div>
      </div>

      <div className={styles.bottomPanel}>
        <button className={styles.boosterBtn} onClick={() => onBoosterClick('blender')}>
          <RefreshCw size={24} />
          <span className={styles.badge}>{boosters.blender}</span>
        </button>
        <button className={styles.boosterBtn} onClick={() => onBoosterClick('skewer')}>
          <Zap size={24} />
          <span className={styles.badge}>{boosters.skewer}</span>
        </button>
        <button className={styles.boosterBtn} onClick={() => onBoosterClick('watering')}>
          <Droplets size={24} />
          <span className={styles.badge}>{boosters.watering}</span>
        </button>
        <button className={styles.boosterBtn} onClick={() => onBoosterClick('rake')}>
          <Grid size={24} />
          <span className={styles.badge}>{boosters.rake}</span>
        </button>
      </div>
    </>
  );
}
