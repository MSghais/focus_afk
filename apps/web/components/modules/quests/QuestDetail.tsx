import React from 'react';
import styles from './QuestDetail.module.scss';

export interface QuestDetailProps {
  title: string;
  description: string;
  difficulty: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  xpReward: number;
  badgeReward?: string;
  onAction?: () => void;
  actionLabel?: string;
}

const QuestDetail: React.FC<QuestDetailProps> = ({
  title,
  description,
  difficulty,
  status,
  xpReward,
  badgeReward,
  onAction,
  actionLabel = 'Accept Quest',
}) => (
  <div className={styles.questDetail}>
    <h2 className={styles.title}>{title}</h2>
    <div className={styles.difficulty}>Difficulty: {difficulty}</div>
    <div className={styles.status}>Status: <span className={styles[status]}>{status}</span></div>
    <div className={styles.description}>{description}</div>
    <div className={styles.rewards}>
      <span className={styles.xp}>Reward: +{xpReward} XP</span>
      {badgeReward && <span className={styles.badge}>🏅 {badgeReward}</span>}
    </div>
    {onAction && (
      <button className={styles.actionBtn} onClick={onAction}>{actionLabel}</button>
    )}
  </div>
);

export default QuestDetail; 