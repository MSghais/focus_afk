'use client';

import { useState } from 'react';
import { Task } from '../../../types';
import { Icon } from '../../small/icons';
import styles from '../../../styles/components/task-card.module.scss';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  className?: string;
  compact?: boolean;
}

export default function TaskCard({
  task,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onDuplicate,
  className = '',
  compact = false
}: TaskCardProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  // Task priority colors and icons
  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '🔥',
          label: 'High Priority'
        };
      case 'medium':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '⚡',
          label: 'Medium Priority'
        };
      case 'low':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '🌱',
          label: 'Low Priority'
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '📝',
          label: 'No Priority'
        };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time estimate
  const formatTimeEstimate = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Get task status
  const getTaskStatus = () => {
    if (task.completed) return 'completed';
    if (task.isArchived) return 'archived';
    return 'active';
  };

  const taskStatus = getTaskStatus();

  return (
    <div
      className={`${styles.taskCard} border border-gray-200 ${className} ${taskStatus === 'completed' ? styles.completed : ''
        } ${taskStatus === 'archived' ? styles.archived : ''} ${compact ? styles.compact : ''
        }`}
    >
      {/* Task Header */}
      <div className={styles.taskHeader}>
        <div className={styles.taskMain}>
          {/* Checkbox */}
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onComplete?.(task)}
              className={styles.checkbox}
              aria-label={`Mark task as ${task.completed ? 'incomplete' : 'complete'}`}
            />
          </div>

          {/* Task Info */}
          <div className={styles.taskInfo}>
            <div className={styles.taskTitleRow}>
              <h3 className={`${styles.taskTitle} ${task.completed ? styles.strikethrough : ''}`}>
                {task.title}
              </h3>

              {/* Priority Badge */}
              <div className={`${styles.priorityBadge} ${priorityConfig.bgColor} ${priorityConfig.borderColor}`}>
                <span className={styles.priorityIcon}>{priorityConfig.icon}</span>
                <span className={`${styles.priorityText} ${priorityConfig.textColor}`}>
                  {task.priority}
                </span>
              </div>

              {/* Status Badges */}
              {task.completed && (
                <div className={`${styles.statusBadge} ${styles.completedBadge}`}>
                  <Icon name="check" />
                  <span>Completed</span>
                </div>
              )}

              {task.isArchived && (
                <div className={`${styles.statusBadge} ${styles.archivedBadge}`}>
                  <span>📦</span>
                  <span>Archived</span>
                </div>
              )}
            </div>

            {/* Task Meta */}
            <div className={styles.taskMeta}>
              {task.category && (
                <span className={styles.category}>
                  <Icon name="tag" />
                  {task.category}
                </span>
              )}

              {task.estimatedMinutes && task.estimatedMinutes > 0 && (
                <span className={styles.timeEstimate}>
                  <Icon name="clock" />
                  {formatTimeEstimate(task.estimatedMinutes)}
                </span>
              )}

              {task.dueDate && (
                <span className={styles.dueDate}>
                  <Icon name="calendar" />
                  {formatDate(new Date(task.dueDate))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description Toggle and Content */}
      {task.description && !compact && (
        <div className={styles.descriptionSection}>
          <button
            onClick={() => setShowDescription(!showDescription)}
            className={styles.descriptionToggle}
            aria-label={showDescription ? 'Hide description' : 'Show description'}
          >
            <Icon name={showDescription ? "chevron-up" : "chevron-down"} />
            <span>{showDescription ? 'Hide Description' : 'Show Description'}</span>
          </button>

          {showDescription && (
            <div className={styles.descriptionContent}>
              <p>{task.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Compact Description */}
      {task.description && compact && (
        <div className={styles.compactDescription}>
          <p>{task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}</p>
        </div>
      )}

      {/* Progress Indicator */}
      {task.estimatedMinutes && task.estimatedMinutes > 0 && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${task.completed ? 100 : 0}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {task.completed ? 'Completed' : `${formatTimeEstimate(task.estimatedMinutes)} remaining`}
          </span>
        </div>
      )}

      {/* Action Buttons - Bottom */}
      <div className={styles.actionButtonsBottom}>
        {/* Mobile Actions Menu */}
        <div className={styles.mobileActions}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={styles.mobileMenuButton}
            aria-label="Show task actions"
          >
            <Icon name="more" />
          </button>

          {showMobileMenu && (
            <div className={styles.mobileMenu}>
              {onEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className={styles.mobileAction}
                >
                  <Icon name="edit" />
                  Edit
                </button>
              )}

              {onComplete && (
                <button
                  onClick={() => onComplete(task)}
                  className={styles.mobileAction}
                >
                  <Icon name={task.completed ? "undo" : "check"} />
                  {task.completed ? 'Undo' : 'Complete'}
                </button>
              )}

              {onArchive && !task.isArchived && (
                <button
                  onClick={() => onArchive(task)}
                  className={styles.mobileAction}
                >
                  <Icon name="archive" />
                  Archive
                </button>
              )}

              {onArchive && task.isArchived && (
                <button
                  onClick={() => onArchive(task)}
                  className={styles.mobileAction}
                >
                  <Icon name="archive" />
                  Unarchive
                </button>
              )}

              {onDuplicate && (
                <button
                  onClick={() => onDuplicate(task)}
                  className={styles.mobileAction}
                >
                  <Icon name="copy" />
                  Duplicate
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(task)}
                  className={`${styles.mobileAction} ${styles.deleteAction}`}
                >
                  <Icon name="delete" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Action Buttons */}
        <div className={styles.desktopActions}>
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className={`${styles.actionButton} ${styles.editButton}`}
              title="Edit task"
            >
              <Icon name="edit" />
              <span>Edit</span>
            </button>
          )}

          {onComplete && (
            <button
              onClick={() => onComplete(task)}
              className={`${styles.actionButton} ${task.completed ? styles.undoButton : styles.completeButton
                }`}
              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <Icon name={task.completed ? "undo" : "check"} />
              <span>{task.completed ? 'Undo' : 'Complete'}</span>
            </button>
          )}

          {onArchive && !task.isArchived && (
            <button
              onClick={() => onArchive(task)}
              className={`${styles.actionButton} ${styles.archiveButton}`}
              title="Archive task"
            >
              <Icon name="archive" />
              <span>Archive</span>
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => onDuplicate(task)}
              className={`${styles.actionButton} ${styles.duplicateButton}`}
              title="Duplicate task"
            >
              <Icon name="copy" />
              <span>Duplicate</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(task)}
              className={`${styles.actionButton} ${styles.deleteButton}`}
              title="Delete task"
            >
              <Icon name="delete" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 