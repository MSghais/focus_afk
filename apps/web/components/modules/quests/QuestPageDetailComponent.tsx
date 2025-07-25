'use client';
import React, { useEffect, useState } from 'react';
import styles from './QuestDetail.module.scss';
import api from '../../../lib/api';
import { Quest } from '../../../lib/gamification';
import TimeLoading from '../../small/loading/time-loading';
import { tryMarkdownToHtml } from '../../../lib/helpers';
import { ButtonPrimary, ButtonSimple } from '../../small/buttons';

export interface QuestPageDetailProps {
  id?: string;
  onAction?: () => void;
  actionLabel?: string;
}

const QuestPageDetailComponent: React.FC<QuestPageDetailProps> = ({
  id,
  onAction,
  actionLabel,
}) => {

  if (!id) return null;

  const [quest, setQuest] = useState<Quest | null>(null);
  // if (!quest) return null;

  const loadQuest = async (id: string) => {
    const quest = await api.getQuest(id);
    console.log('quest', quest);
    if (quest) {
      setQuest(quest?.data as Quest);
    }
  }

  useEffect(() => {
    if (id) {
      loadQuest(id);
    }
  }, [id]);

  if (!quest) return <TimeLoading />;

  const { title, name, description, status, badgeReward } = quest;
  return (
    <div className={styles.questDetail}>
      {title && <h2 className={styles.title}>{tryMarkdownToHtml(title)}</h2>}
      {name && <h3 className={styles.title} dangerouslySetInnerHTML={{ __html: tryMarkdownToHtml(name) }}></h3>}
      {/* <div className={styles.difficulty}>Difficulty: {difficulty}</div> */}
      <div className={styles.status}>Status: <span className={styles[status]}>{status}</span></div>
      {description && <div className={styles.description} dangerouslySetInnerHTML={{ __html: tryMarkdownToHtml(description) }}></div>}
      <div className={styles.rewards}>
        {/* <span className={styles.xp}>Reward: +{xpReward} XP</span> */}
        {badgeReward && <span className={styles.badge}>🏅 {badgeReward}</span>}
        {!badgeReward && <span className={styles.badge}>🏅 {quest?.status}</span>}
      </div>

      <div>
        {quest?.rewardBadge && <img src={quest?.rewardBadge} alt={quest?.name} className={styles.badgeImage} />}
        {quest?.levelRequired && <span>Level Required: {quest?.levelRequired}</span>}
        {quest?.rewardXp && <span>XP Reward: {quest?.rewardXp}</span>}
        {quest?.rewardBadge && <span>Badge Reward: {quest?.rewardBadge}</span>}
      </div>

      <div className={styles.questDetailActions}>
        <ButtonSimple onClick={onAction}>{actionLabel}</ButtonSimple>
        {quest?.status === 'completed' && (
          <ButtonPrimary onClick={onAction}>{actionLabel}</ButtonPrimary>
        )}
      </div>


      {onAction && (
        <button className={styles.actionBtn} onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
};

export default QuestPageDetailComponent; 