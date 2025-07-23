import React from 'react';
import styles from './XPBar.module.scss';

interface XPBarProps {
  xp: number;
  maxXp: number;
}

const XPBar: React.FC<XPBarProps> = ({ xp, maxXp }) => {
  const percent = Math.min(100, (xp / maxXp) * 100);
  return (
    <div className={styles.xpBarContainer}>
      <div className={styles.xpBar} style={{ width: `${percent}%` }} />
      <span className={styles.xpText}>{xp} / {maxXp} XP</span>
    </div>
  );
};

export default XPBar; 