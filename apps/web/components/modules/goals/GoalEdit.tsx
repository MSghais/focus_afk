'use client';
import { useState, useEffect } from 'react';
import { Goal, Task } from '../../../types';
import { ButtonPrimary, ButtonSimple } from '../../small/buttons';
import { useFocusAFKStore } from '../../../store/store';
import { useUIStore } from '../../../store/uiStore';

export interface GoalEditProps {
  goal: Goal;
  tasks: Task[];
  onSave?: (updatedGoal: Goal) => void;
  onCancel?: () => void;
}

const GOAL_TYPES = ["Goal", "KPI", "Aim"];

export default function GoalEdit({ goal, tasks, onSave, onCancel }: GoalEditProps) {
  const { updateGoal } = useFocusAFKStore();
  const { showToast } = useUIStore();
  
  const [name, setName] = useState<string>(goal.title || "");
  const [type, setType] = useState<string>(goal?.category || GOAL_TYPES[0]);
  const [description, setDescription] = useState<string>(goal.description || "");
  const [targetDate, setTargetDate] = useState<string>("");
  
  // Initialize linkedTaskIds by combining both relatedTasks and relatedTaskIds
  // and converting all to strings for consistency
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(() => {
    const relatedTasks = goal.relatedTasks || [];
    const relatedTaskIds = goal.relatedTaskIds || [];
    
    // Convert all IDs to strings and combine them
    const allIds = [
      ...relatedTasks.map(id => id.toString()),
      ...relatedTaskIds.map(id => id.toString())
    ];
    
    // Remove duplicates
    return [...new Set(allIds)];
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize targetDate when component mounts
  useEffect(() => {
    if (goal.targetDate) {
      try {
        const dateString = new Date(goal.targetDate).toISOString().split('T')[0];
        if (dateString) {
          setTargetDate(dateString);
        }
      } catch (error) {
        console.error('Error parsing target date:', error);
      }
    }
  }, [goal.targetDate]);

  const handleTaskToggle = (taskId: string) => {
    setLinkedTaskIds((prev: string[]) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Helper function to check if a task is linked
  const isTaskLinked = (taskId: string | undefined): boolean => {
    if (!taskId) return false;
    return linkedTaskIds.includes(taskId);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ message: "Goal title is required", type: "error" });
      return;
    }

    if (!goal.id) {
      showToast({ message: "Goal ID is required", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await updateGoal(goal.id, {
        title: name,
        description: description,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        category: type,
        relatedTaskIds: linkedTaskIds,
      });

      const updatedGoal: Goal = {
        ...goal,
        title: name,
        description: description,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        category: type,
        relatedTaskIds: linkedTaskIds,
        updatedAt: new Date(),
      };

      showToast({ message: "Goal updated successfully", type: "success" });
      onSave?.(updatedGoal);
    } catch (error: any) {
      console.error('Error updating goal:', error);
      showToast({ message: `Failed to update goal: ${error.message}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Edit Goal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Name *
          </label>
          <input 
            type="text" 
            className="w-full p-2 border rounded-md dark:text-white" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select 
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            value={type} 
            onChange={e => setType(e.target.value)}
          >
            {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea 
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Target Date
          </label>
          <input 
            type="date" 
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            value={targetDate} 
            onChange={e => setTargetDate(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Link Tasks
          </label>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600">
            {tasks.length === 0 && (
              <span className="text-xs text-gray-400">No tasks available</span>
            )}
            {tasks.map(task => (
              <label key={task.id || 'temp'} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input 
                  type="checkbox" 
                  checked={isTaskLinked(task.id)} 
                  onChange={() => task.id && handleTaskToggle(task.id)} 
                />
                <span>{task.title}</span>
              </label>
            ))}
          </div>
          {linkedTaskIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {linkedTaskIds.map(id => {
                const task = tasks.find(t => t.id === id);
                return task ? (
                  <span key={id} className="px-2 py-1 text-blue-700 rounded-full text-xs border border-blue-700">
                    {task.title}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-4">
          <ButtonPrimary
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Updating...' : 'Update Goal'}
          </ButtonPrimary>
          <ButtonSimple
            type="button"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </ButtonSimple>
        </div>
      </form>
    </div>
  );
} 