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
  isQuestActionDisabled = false,
}: IQuestItemProps) => {
  if (!quest) return null;

  const { showToast } = useUIStore();
  const router = useRouter();
  const { addTask, deleteTask, tasks } = useFocusAFKStore();
  const [isAddedAsTask, setIsAddedAsTask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAddTask = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
  };

  const handleRemoveTask = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsLoading(true);
    const task = tasks.find(
      task =>
        task.title === quest.title ||
        task.title === quest?.name ||
        task.title === quest?.description
    );
    if (task && task.id) {
      await deleteTask(task.id);
      showToast({ message: 'Task removed', type: 'info' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const task = tasks.find(
      task =>
        task.title === quest.title ||
        task.title === quest?.name ||
        task.title === quest?.description
    );
    setIsAddedAsTask(!!task);
  }, [tasks, quest]);

  const { name, description, status, goal, rewardXp } = quest;

  // Minimal info first, expandable details
  return (
    <div
      className={`${styles.questItem} group transition-all duration-150`}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      onClick={e => {
        setExpanded(exp => !exp);
        onClick?.();
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          setExpanded(exp => !exp);
          onClick?.();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600 font-bold">+{rewardXp} XP</span>
        {badgeReward && (
          <span className="text-xs flex items-center gap-1 text-yellow-600">
            <Icon name="badge" /> {badgeReward}
          </span>
        )}
        <span
          className={`text-xs rounded px-2 py-0.5 ${styles.status} ${styles[status]}`}
        >
          {status}
        </span>

        <span className="text-xs text-gray-500 ml-2 bg-gray-100/10 rounded px-2 py-0.5">
          Lvl {goal}
        </span>
      </div>

      {/* Minimal header row */}
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-semibold text-base truncate"
            dangerouslySetInnerHTML={{ __html: tryMarkdownToHtml(name || '') }}
          />

        </div>

      </div>

      <button
        className="ml-2 p-1 rounded hover:bg-gray-100/20 transition"
        aria-label={expanded ? 'Collapse details' : 'Expand details'}
        tabIndex={-1}
        onClick={e => {
          e.stopPropagation();
          setExpanded(exp => !exp);
        }}
      >
      </button>

      {/* Expandable details */}
      {expanded && (
        <div className="px-3 pb-3 pt-1">
          {description && (
            <div
              className="text-sm text-gray-700 mb-2"
              dangerouslySetInnerHTML={{ __html: tryMarkdownToHtml(description) }}
            />
          )}

          {!isQuestActionDisabled && (
            <div className="flex flex-row gap-2 mt-2">
              {!isAddedAsTask && (
                <ButtonPrimary
                  className={styles.actionButton}
                  onClick={handleAddTask}
                  aria-label="Add as task"
                  disabled={isLoading}
                >
                  <Icon name="add" />
                  {isLoading ? 'Adding...' : 'Add as task'}
                </ButtonPrimary>
              )}
              {isAddedAsTask && (
                <>
                  <ButtonSecondary
                    className={styles.actionButton}
                    onClick={handleRemoveTask}
                    aria-label="Remove task"
                    disabled={isLoading}
                  >
                    <Icon name="badge" />
                    {isLoading ? 'Removing...' : 'Remove task'}
                  </ButtonSecondary>
                  <ButtonPrimary
                    className={styles.actionButton}
                    onClick={() => {
                      // e.stopPropagation();
                      router?.push(`/quests/${quest?.id}`);
                    }}
                    aria-label="View task"
                  >
                    <Icon name="eye" />
                    View task
                  </ButtonPrimary>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestItem;