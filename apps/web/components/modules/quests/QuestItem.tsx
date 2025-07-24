import React from 'react';
import styles from './QuestItem.module.scss';
import { Quest } from '../../../lib/gamification';
import { tryMarkdownToHtml } from '../../../lib/helpers';
import { Icon } from '../../small/icons';
import { useFocusAFKStore } from '../../../store/store';
import { useUIStore } from '../../../store/uiStore';
import { ButtonPrimary } from '../../small/buttons';
import { cp } from 'fs';


interface IQuestItemProps {
  quest?: Quest;
  onClick?: () => void;
  badgeReward?: string;
  isQuestActionDisabled?: boolean;
}

const QuestItem: React.FC<IQuestItemProps> = ({
  quest,
  onClick,
  badgeReward,
  isQuestActionDisabled,
}: IQuestItemProps) => {

  if (!quest) {
    return null;
  }
  const {showModal, showToast} = useUIStore();

  const {addTask} = useFocusAFKStore();

  const handleAddTask = async () => {
   const newTask =  await addTask({
      title: quest.title || quest?.name || quest?.description,
      description: quest.description,
      priority: 'medium',
      dueDate: new Date(),
      completed: false, 
    });
    if(newTask) {
      showToast({ message: 'Task added', type: 'success' });
    }
  }


  const { name, description, type, status, progress, goal, rewardXp } = quest;
  return (
    <div className={styles.questItem} onClick={onClick} tabIndex={0} role="button">
      <div className={styles.header}>
        {name ? <span className={styles.title} dangerouslySetInnerHTML={{ __html: tryMarkdownToHtml(name) }}></span> : null}
        <span className={styles.difficulty}>Lvl {goal}</span>
      </div>
      {description ? <div className={styles.description} dangerouslySetInnerHTML={{ __html: tryMarkdownToHtml(description) }}></div> : null}
      <div className={styles.footer}>
        <span className={styles.xp}>+{rewardXp} XP</span>
        {badgeReward && <span className={styles.badge}>🏅 {badgeReward}</span>}
        <span className={`${styles.status} ${styles[status]}`}>{status}</span>
      </div>

      {!isQuestActionDisabled && <>

        <ButtonPrimary className={styles.actionButton} onClick={handleAddTask}>
          <Icon name="add" />
          Add as task
        </ButtonPrimary>
        {/* <button className={styles.actionButton} onClick={onClick}>
          Accept
        </button> */}

      </>
      }
    </div>
  );
};

export default QuestItem; 