import React from 'react';
import styles from './StreakCounter.module.scss';

interface StreakCounterProps {
  streak: number;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak }) => (
  <div className={styles.streakCounter}>
    <span className={styles.fireIcon} role="img" aria-label="fire">🔥</span>
    <span className={styles.streakNumber}>{streak}</span>
  </div>
);

export default StreakCounter; 