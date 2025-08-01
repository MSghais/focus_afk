'use client';

import { useState, useEffect } from 'react';
import { Task } from '../../../types';
import { ButtonPrimary } from '../../small/buttons';

interface CreateTaskEnhancedProps {
  initialTask?: Task;
  initialDueDate?: Date;
  onSave?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export default function CreateTaskEnhanced({ 
  initialTask, 
  initialDueDate, 
  onSave, 
  onCancel, 
  className = '' 
}: CreateTaskEnhancedProps) {
  const [task, setTask] = useState({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    priority: initialTask?.priority || 'medium' as Task['priority'],
    category: initialTask?.category || '',
    dueDate: initialDueDate 
      ? initialDueDate.toISOString().split('T')[0] 
      : initialTask?.dueDate 
        ? new Date(initialTask.dueDate).toISOString().split('T')[0]
        : '',
    estimatedMinutes: initialTask?.estimatedMinutes || 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialTask;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const taskData = {
        title: task.title.trim(),
        description: task.description.trim() || undefined,
        completed: initialTask?.completed || false,
        priority: task.priority,
        category: task.category.trim() || undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        estimatedMinutes: task.estimatedMinutes || undefined
      };

      if (onSave) {
        await onSave(taskData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={task.title}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter task title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Enter task description (optional)"
          />
        </div>

        {/* Priority and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={task.priority}
              onChange={(e) => setTask({ ...task, priority: e.target.value as Task['priority'] })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              id="category"
              type="text"
              value={task.category}
              onChange={(e) => setTask({ ...task, category: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Work, Personal, etc."
            />
          </div>
        </div>

        {/* Due Date and Estimated Time Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={task.dueDate}
              onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="estimatedMinutes" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Time (minutes)
            </label>
            <input
              id="estimatedMinutes"
              type="number"
              value={task.estimatedMinutes}
              onChange={(e) => setTask({ ...task, estimatedMinutes: parseInt(e.target.value) || 0 })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <ButtonPrimary
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
          </ButtonPrimary>
          
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 