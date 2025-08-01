'use client';

import { useState, useMemo } from 'react';
import { Task } from '../../../types';
import { Icon } from '../../small/icons';
import styles from '../../../styles/components/task-calendar.module.scss';

interface TaskCalendarWeekProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskDrop?: (taskId: string, newDate: Date) => void;
  className?: string;
}

interface WeekDay {
  date: Date;
  isToday: boolean;
  tasks: Task[];
}

export default function TaskCalendarWeek({ tasks, onTaskClick, onTaskDrop, className = '' }: TaskCalendarWeekProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Get current week's start (Sunday) and end (Saturday)
  const weekStart = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [currentDate]);

  // Generate week days
  const weekDays = useMemo(() => {
    const days: WeekDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);

      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
      });

      days.push({
        date,
        isToday: date.toDateString() === today.toDateString(),
        tasks: dayTasks
      });
    }

    return days;
  }, [weekStart, tasks]);

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (draggedTask && onTaskDrop) {
      onTaskDrop(draggedTask.id || '', targetDate);
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // Task priority colors
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get week range
  const getWeekRange = () => {
    if (weekDays.length < 7) return '';
    
    const start = weekDays[0]?.date;
    const end = weekDays[6]?.date;
    
    if (!start || !end) return '';
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${start.getDate()}-${end.getDate()}`;
    } else if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
  };

  return (
    <div className={`${styles.taskCalendarWeek} ${className}`}>
      {/* Week Header */}
      <div className={styles.weekHeader}>
        <div className={styles.navigation}>
          <button
            onClick={goToPreviousWeek}
            className={styles.navButton}
            aria-label="Previous week"
          >
            <Icon name="chevron-left" />
          </button>
          
          <div className={styles.currentWeek}>
            <h2 className={styles.weekTitle}>{getWeekRange()}</h2>
            <button
              onClick={goToToday}
              className={styles.todayButton}
            >
              Today
            </button>
          </div>
          
          <button
            onClick={goToNextWeek}
            className={styles.navButton}
            aria-label="Next week"
          >
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className={styles.weekGrid}>
        {/* Day Headers */}
        <div className={styles.weekDayHeaders}>
          {weekDays.map((day, index) => (
            <div key={index} className={styles.weekDayHeader}>
              <div className={styles.dayName}>
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`${styles.dayDate} ${day.isToday ? styles.today : ''}`}>
                {day.date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Week Days */}
        <div className={styles.weekDays}>
          {weekDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={`${styles.weekDay} ${day.isToday ? styles.today : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.date)}
            >
              <div className={styles.dayTasks}>
                {day.tasks.length === 0 ? (
                  <div className={styles.noTasks}>
                    <span className={styles.noTasksText}>No tasks</span>
                  </div>
                ) : (
                  day.tasks.map((task, taskIndex) => (
                    <div
                      key={task.id}
                      className={`${styles.weekTask} ${
                        task.completed ? styles.completed : ''
                      } ${task.isArchived ? styles.archived : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick?.(task);
                      }}
                      title={`${task.title} (${task.priority})`}
                    >
                      <div className={styles.taskHeader}>
                        <div className={`${styles.priorityDot} ${getPriorityColor(task.priority)}`} />
                        <span className={styles.taskTitle}>
                          {task.title}
                        </span>
                        {task.completed && <span className={styles.completedBadge}>✓</span>}
                        {task.isArchived && <span className={styles.archivedBadge}>📦</span>}
                      </div>
                      {task.description && (
                        <div className={styles.taskDescription}>
                          {task.description.length > 50 
                            ? task.description.substring(0, 50) + '...' 
                            : task.description}
                        </div>
                      )}
                      <div className={styles.taskMeta}>
                        <span className={styles.taskPriority}>{task.priority}</span>
                        {task.category && (
                          <span className={styles.taskCategory}>{task.category}</span>
                        )}
                        {task.estimatedMinutes && task.estimatedMinutes > 0 && (
                          <span className={styles.taskDuration}>{task.estimatedMinutes}m</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 