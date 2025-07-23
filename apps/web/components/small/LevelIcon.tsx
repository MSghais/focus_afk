import React from 'react';
import styles from './LevelIcon.module.scss';

interface LevelIconProps {
  level: number;
}

const LevelIcon: React.FC<LevelIconProps> = ({ level }) => (
  <div className={styles.levelIcon}>
    <span className={styles.levelNumber}>{level}</span>
  </div>
);

export default LevelIcon; 