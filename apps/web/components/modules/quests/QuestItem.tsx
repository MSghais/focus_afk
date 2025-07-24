import React, { useEffect, useState } from 'react';
import styles from './QuestItem.module.scss';
import { Quest } from '../../../lib/gamification';
import { tryMarkdownToHtml } from '../../../lib/helpers';
import { Icon } from '../../small/icons';
import { useFocusAFKStore } from '../../../store/store';
import { useUIStore } from '../../../store/uiStore';
import { ButtonPrimary, ButtonSecondary } from '../../small/buttons';
import { useRouter } from 'next/navigation';


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
  const { showModal, showToast } = useUIStore();
  const router = useRouter();
  const { addTask, deleteTask, tasks } = useFocusAFKStore();
  const [isAddedAsTask, setIsAddedAsTask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTask = async () => {
    setIsLoading(true);
    const newTask = await addTask({
      title: quest.title || quest?.name || quest?.description,
      description: quest.description,
      priority: 'medium',
      dueDate: new Date(),
      completed: false,
    });
    setIsLoading(false);
    if (newTask) {
      showToast({ message: 'Task added', type: 'success' });
    }
  }

  const handleRemoveTask = async () => {
    setIsLoading(true);
    // Find the task by title/name/description
    const task = tasks.find(task => task.title === quest.title || task.title === quest?.name || task.title === quest?.description);
    if (task && task.id) {
      await deleteTask(task.id);
      showToast({ message: 'Task removed', type: 'info' });
    }
    setIsLoading(false);
  }

  useEffect(() => {
    console.log("tasks", tasks);

    if (tasks.length > 0) {
      const task = tasks.find(task => task.title === quest.title || task.title === quest?.name || task.title === quest?.description);
      if (task) {
        setIsAddedAsTask(true);
      }
    }
  }, [tasks]);


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

      {!isQuestActionDisabled && 
      <div className={styles.actions}>
        {!isAddedAsTask && (
          <ButtonPrimary className={styles.actionButton} onClick={handleAddTask} aria-label="Add as task">
            <Icon name="add" />
            {isLoading ? 'Adding...' : 'Add as task'}
          </ButtonPrimary>
        )}
        {isAddedAsTask && (
          <div className="flex flex-row gap-2">
          <ButtonSecondary className={styles.actionButton} onClick={handleRemoveTask} aria-label="Remove task">
            <Icon name="badge" />
            {isLoading ? 'Removing...' : 'Remove task'}
          </ButtonSecondary>
          <ButtonPrimary   className={styles.actionButton} onClick={() => router?.push(`/tasks/${quest?.id}`)} aria-label="View task">
            <Icon name="eye" />
            View task
          </ButtonPrimary>
          </div>
        )}
      </div>
      }
    </div>
  );
};

export default QuestItem; 