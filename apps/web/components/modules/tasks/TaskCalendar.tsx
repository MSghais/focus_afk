'use client';

import { useState, useEffect, useMemo } from 'react';
import { Task } from '../../../types';
import { Icon } from '../../small/icons';
import styles from '../../../styles/components/task-calendar.module.scss';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskDrop?: (taskId: string, newDate: Date) => void;
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
}

export default function TaskCalendar({ tasks, onTaskClick, onTaskDrop, className = '' }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Get current month's start and end dates
  const monthStart = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }, [currentDate]);

  // Get calendar start (including previous month's days)
  const calendarStart = useMemo(() => {
    const start = new Date(monthStart);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    return start;
  }, [monthStart]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(calendarStart);
      date.setDate(date.getDate() + i);

      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
      });

      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate ? date.toDateString() === selectedDate.toDateString() : false,
        tasks: dayTasks
      });
    }

    return days;
  }, [calendarStart, currentDate, tasks, selectedDate]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
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
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className={`${styles.taskCalendar} ${className}`}>
      {/* Calendar Header */}
      <div className={styles.calendarHeader}>
        <div className={styles.navigation}>
          <button
            onClick={goToPreviousMonth}
            className={styles.navButton}
            aria-label="Previous month"
          >
            <Icon name="chevron-left" />
          </button>
          
          <div className={styles.currentMonth}>
            <h2 className={styles.monthTitle}>{getMonthName(currentDate)}</h2>
            <button
              onClick={goToToday}
              className={styles.todayButton}
            >
              Today
            </button>
          </div>
          
          <button
            onClick={goToNextMonth}
            className={styles.navButton}
            aria-label="Next month"
          >
            <Icon name="chevron-right" />
          </button>
        </div>

        <div className={styles.viewToggle}>
          <button
            onClick={() => setViewMode('month')}
            className={`${styles.viewButton} ${viewMode === 'month' ? styles.active : ''}`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`${styles.viewButton} ${viewMode === 'week' ? styles.active : ''}`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarGrid}>
        {/* Day Headers */}
        <div className={styles.dayHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={styles.daysGrid}>
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`${styles.calendarDay} ${
                !day.isCurrentMonth ? styles.otherMonth : ''
              } ${day.isToday ? styles.today : ''} ${
                day.isSelected ? styles.selected : ''
              }`}
              onClick={() => setSelectedDate(day.date)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.date)}
            >
              {/* Date Number */}
              <div className={styles.dateNumber}>
                {day.date.getDate()}
              </div>

              {/* Task Indicators */}
              <div className={styles.taskIndicators}>
                {day.tasks.slice(0, 3).map((task, taskIndex) => (
                  <div
                    key={task.id}
                    className={`${styles.taskIndicator} ${
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
                    <div className={`${styles.priorityDot} ${getPriorityColor(task.priority)}`} />
                    <span className={styles.taskTitle}>
                      {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                    </span>
                  </div>
                ))}
                
                {day.tasks.length > 3 && (
                  <div className={styles.moreTasks}>
                    +{day.tasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Tasks */}
      {selectedDate && (
        <div className={styles.selectedDateTasks}>
          <div className={styles.selectedDateHeader}>
            <h3 className={styles.selectedDateTitle}>
              {formatDate(selectedDate)}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className={styles.closeButton}
            >
              <Icon name="close" />
            </button>
          </div>
          
          <div className={styles.selectedDateTaskList}>
            {calendarDays.find(day => day.isSelected)?.tasks.length === 0 ? (
              <p className={styles.noTasks}>No tasks for this date</p>
            ) : (
              calendarDays.find(day => day.isSelected)?.tasks.map(task => (
                <div
                  key={task.id}
                  className={`${styles.selectedDateTask} ${
                    task.completed ? styles.completed : ''
                  } ${task.isArchived ? styles.archived : ''}`}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className={styles.taskInfo}>
                    <div className={styles.taskHeader}>
                      <span className={`${styles.priorityDot} ${getPriorityColor(task.priority)}`} />
                      <h4 className={styles.taskTitle}>{task.title}</h4>
                      {task.completed && <span className={styles.completedBadge}>✓</span>}
                      {task.isArchived && <span className={styles.archivedBadge}>📦</span>}
                    </div>
                    {task.description && (
                      <p className={styles.taskDescription}>{task.description}</p>
                    )}
                    <div className={styles.taskMeta}>
                      <span className={styles.taskPriority}>{task.priority}</span>
                      {task.category && (
                        <span className={styles.taskCategory}>{task.category}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 