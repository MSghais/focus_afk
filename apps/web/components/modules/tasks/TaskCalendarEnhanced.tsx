'use client';

import { useState, useEffect, useMemo } from 'react';
import { Task } from '../../../types';
import { Icon } from '../../small/icons';
import { useUIStore } from '../../../store/uiStore';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/task-calendar.module.scss';
import CreateTaskEnhanced from './CreateTaskEnhanced';
import TaskCard from './TaskCard';
import Link from 'next/link';

interface TaskCalendarEnhancedProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskDrop?: (taskId: string, newDate: Date) => void;
  className?: string;
  isViewGoogleCalendar?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
}

export default function TaskCalendarEnhanced({ tasks, onTaskClick, onTaskDrop, className = '', isViewGoogleCalendar = true }: TaskCalendarEnhancedProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { showModal, hideModal } = useUIStore();
  const { updateTask, deleteTask, toggleTaskComplete, addTask } = useFocusAFKStore();

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

  // Task action handlers
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    showModal(
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Task</h2>
        <CreateTaskEnhanced 
          initialTask={task}
          onSave={async (updatedTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
            if (task.id) {
              await updateTask(task.id, updatedTask);
              setEditingTask(null);
              hideModal();
            }
          }}
          onCancel={() => {
            setEditingTask(null);
            hideModal();
          }}
        />
      </div>
    );
  };

  const handleArchiveTask = async (task: Task) => {
    if (task.id) {
      await updateTask(task.id, { ...task, isArchived: !task.isArchived });
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (confirm('Are you sure you want to delete this task?')) {
      if (task.id) {
        await deleteTask(task.id);
      }
    }
  };

  const handleCompleteTask = async (task: Task) => {
    if (task.id) {
      await toggleTaskComplete(task.id, !task.completed);
    }
  };

  const handleCreateTask = (date: Date) => {
    setSelectedDate(date);
    setShowCreateForm(true);
    showModal(
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
        <p className="text-gray-600 mb-4">Due date: {date.toLocaleDateString()}</p>
        <CreateTaskEnhanced 
          initialDueDate={date}
          onSave={async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
            await addTask(newTask);
            setShowCreateForm(false);
            hideModal();
          }}
          onCancel={() => {
            setShowCreateForm(false);
            hideModal();
          }}
        />
      </div>
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayTasks = calendarDays.find(day => day.date.toDateString() === date.toDateString())?.tasks || [];
    
    if (dayTasks.length === 0) {
      // No tasks for this date, show create form
      handleCreateTask(date);
    } else {
      // Show tasks for this date
      showModal(
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Tasks for {formatDate(date)}</h2>
            <button
              onClick={() => handleCreateTask(date)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Icon name="add" />
              Add Task
            </button>
          </div>
          
          <div className="space-y-4">
            {dayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onComplete={handleCompleteTask}
                onArchive={handleArchiveTask}
                onDelete={handleDeleteTask}
                onDuplicate={(task) => {
                  // Handle duplicate task
                  const duplicatedTask = {
                    ...task,
                    title: `${task.title} (Copy)`,
                    completed: false,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  delete duplicatedTask.id;
                  addTask(duplicatedTask);
                }}
              />
            ))}
          </div>
        </div>
      );
    }
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

        {isViewGoogleCalendar && (
              <Link
                href="/calendar/manager"
                className={styles.googleCalendarButton + " flex items-center gap-2 px-2 py-2 rounded-md transition border border-gray-200"}
              >
                <Icon name="calendar" />
                Google Calendar
              </Link>
            )}

        {/* <div className={styles.viewToggle}>
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
        </div> */}
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
              onClick={() => handleDateClick(day.date)}
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
    </div>
  );
} 