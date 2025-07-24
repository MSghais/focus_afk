import React from 'react';
import styles from './XPBar.module.scss';

interface XPBarProps {
  xp: number;
  maxXp: number;
}

const XPBar: React.FC<XPBarProps> = ({ xp, maxXp }) => {
  // Prevent division by zero and negative values
  const safeMaxXp = Math.max(1, maxXp);
  const safeXp = Math.max(0, xp);
  const percent = Math.min(100, (safeXp / safeMaxXp) * 100);

  return (
    <div className={styles.xpBarContainer} aria-label="XP Progress Bar">
      <div className={styles.xpBarTrack}>
        <div
          className={styles.xpBar}
          style={{ width: `${percent}%` }}
          aria-valuenow={safeXp}
          aria-valuemax={safeMaxXp}
          aria-valuemin={0}
          role="progressbar"
        />
      </div>
      <span className={styles.xpText}>
        {safeXp} / {safeMaxXp} XP
      </span>
    </div>
  );
};

export default XPBar;