'use client';

import { useState, useEffect } from 'react';
import { Task } from '../../../types';
import { Icon } from '../../small/icons';
import styles from '../../../styles/components/task-filter.module.scss';

interface TaskOrderManagerProps {
  tasks: Task[];
  onOrderChange: (orderedTaskIds: string[]) => void;
  className?: string;
}

export default function TaskOrderManager({ tasks, onOrderChange, className = '' }: TaskOrderManagerProps) {
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  useEffect(() => {
    setOrderedTasks(tasks.filter(task => task));
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (task) {
      setDraggedTask(task);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.id === targetTask.id) return;

    const draggedIndex = orderedTasks.findIndex(t => t.id === draggedTask.id);
    const targetIndex = orderedTasks.findIndex(t => t.id === targetTask.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrderedTasks = [...orderedTasks];
    const [removed] = newOrderedTasks.splice(draggedIndex, 1);
    if (removed) {
      newOrderedTasks.splice(targetIndex, 0, removed);
    }

    setOrderedTasks(newOrderedTasks);
    onOrderChange(newOrderedTasks.map(t => t.id || ''));
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const moveTask = (taskId: string, direction: 'up' | 'down') => {
    const currentIndex = orderedTasks.findIndex(t => t.id === taskId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= orderedTasks.length) return;

    const newOrderedTasks = [...orderedTasks];
    const [moved] = newOrderedTasks.splice(currentIndex, 1);
    if (moved) {
      newOrderedTasks.splice(newIndex, 0, moved);
    }

    setOrderedTasks(newOrderedTasks);
    onOrderChange(newOrderedTasks.map(t => t.id || ''));
  };

  const resetOrder = () => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    setOrderedTasks(sortedTasks);
    onOrderChange(sortedTasks.map(t => t.id || ''));
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={`${styles.taskOrderManager} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="sort" />
          <h3 className="font-medium">Custom Order</h3>
          <span className="text-sm text-gray-500">
            ({orderedTasks.length} tasks)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetOrder}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
            title="Reset to priority order"
          >
            Reset
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <Icon name={isExpanded ? "chevron-up" : "chevron-down"} />
          </button>
        </div>
      </div>

      {/* Instructions */}
      {isExpanded && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Drag and drop tasks to reorder them, or use the arrow buttons. 
            This custom order will be used when "Custom order" is selected in the sort options.
          </p>
        </div>
      )}

      {/* Task List */}
      {isExpanded && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {orderedTasks.filter((task): task is Task => !!task).map((task, index) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, task)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-3 border rounded-md cursor-move
                transition-all hover:shadow-sm
                ${draggedTask?.id === task.id ? 'opacity-50' : ''}
                ${getPriorityColor(task.priority)}
              `}
            >
              {/* Drag Handle */}
              <div className="text-gray-400 hover:text-gray-600">
                <Icon name="drag" />
              </div>

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.completed && (
                    <span className="text-green-600 text-xs">✓</span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 truncate">{task.description}</p>
                )}
              </div>

              {/* Order Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveTask(task.id || '', 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <Icon name="chevron-up" />
                </button>
                <button
                  onClick={() => moveTask(task.id || '', 'down')}
                  disabled={index === orderedTasks.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <Icon name="chevron-down" />
                </button>
              </div>

              {/* Position Indicator */}
              <div className="text-xs text-gray-400 font-mono">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary when collapsed */}
      {!isExpanded && (
        <div className="text-sm text-gray-600">
          Custom order is {orderedTasks.length > 0 ? 'active' : 'not set'}. 
          Click to expand and manage task order.
        </div>
      )}
    </div>
  );
} 