import React from 'react';
import styles from './QuestItem.module.scss';

export interface QuestItemProps {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  xpReward: number;
  badgeReward?: string;
  onClick?: () => void;
}

const QuestItem: React.FC<QuestItemProps> = ({
  title,
  description,
  difficulty,
  status,
  xpReward,
  badgeReward,
  onClick,
}) => (
  <div className={styles.questItem} onClick={onClick} tabIndex={0} role="button">
    <div className={styles.header}>
      <span className={styles.title}>{title}</span>
      <span className={styles.difficulty}>Lvl {difficulty}</span>
    </div>
    <div className={styles.description}>{description}</div>
    <div className={styles.footer}>
      <span className={styles.xp}>+{xpReward} XP</span>
      {badgeReward && <span className={styles.badge}>🏅 {badgeReward}</span>}
      <span className={`${styles.status} ${styles[status]}`}>{status}</span>
    </div>
  </div>
);

export default QuestItem; 