import React, { useEffect, useState } from 'react';
import styles from './QuestDetail.module.scss';
import api from '../../../lib/api';
import { Quest } from '../../../lib/gamification';

export interface QuestPageDetailProps {
  id?: string;
}

const QuestPageDetail: React.FC<QuestPageDetailProps> = ({
  id,
}) => {

  const [quest, setQuest] = useState<Quest | null>(null);
  if (!quest) return null;

  const loadQuest = async (id: string) => {
    const quest = await api.getQuest(id);
    if (quest) {
      setQuest(quest as unknown as Quest);
    }
  }

  useEffect(() => {
    if (id) {
      loadQuest(id);
    }
  }, [id]);

  const { title, description, difficulty, status, xpReward, badgeReward } = quest;
  return (
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
  )
};

export default QuestPageDetail; 