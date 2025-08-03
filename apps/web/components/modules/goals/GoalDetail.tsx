'use client';
import { useEffect, useMemo, useState } from 'react';
import GoalEdit from './GoalEdit';
import { useFocusAFKStore } from '../../../store/store';
import { ButtonPrimary, ButtonSimple } from '../../small/buttons';
import { Goal, Task } from '../../../types';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import TimeLoading from '../../small/loading/time-loading';
import { useRecommendersStore } from '../../../store/recommenders';
import { useUIStore } from '../../../store/uiStore';
import { Icon } from '../../small/icons';
import { isUserAuthenticated } from '../../../lib/auth';
import { dbUtils } from '../../../lib/database';
import GoalTaskRecommended from './GoalTaskRecommended';

export interface GoalDetailProps {
  goalIdProps?: string;
  goalProps?: Goal;
  onClose?: () => void;
  onDelete?: () => void;
}

export default function GoalDetail({ goalIdProps, goalProps, onClose, onDelete }: GoalDetailProps) {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const { goals, tasks, addGoal, loadGoals, loadTasks, selectedGoal, setSelectedGoal, addTask, updateGoal } = useFocusAFKStore();

  const { showToast, showModal, hideModal } = useUIStore();
  const { setTasksRecommendations, tasksRecommendations } = useRecommendersStore();
  const [goal, setGoal] = useState<Goal | null>(goalProps || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'backend' | 'local' | null>(null);


  const [isSuggestionsTasksAdded, setIsSuggestionsTasksAdded] = useState<boolean>(false);

  const [tasksAdded, setTasksAdded] = useState<Task[]>([]);
  let { id } = useParams();
  let goalId = goalIdProps || id;

  const foundGoal = useMemo(() => goals.find(g => Number(g.id) === Number(goalId)), [goals, goalId]);
  const foundTask = useMemo(() => tasks.find(t => Number(t.id) === Number(goal?.relatedTasks?.[0])), [tasks, goal]);

  // Get related tasks for the current goal
  const relatedTasks = useMemo(() => {
    if (!goal || !tasks.length) return [];

    // Handle both relatedTasks (number[]) and relatedTaskIds (string[])
    const taskIds = goal.relatedTasks || goal.relatedTaskIds || [];

    return tasks.filter(task => {
      if (!task.id) return false;
      return taskIds.some(id =>
        task.id?.toString() === id.toString()
      );
    });
  }, [goal, tasks]);

  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Load goal data with proper fallback strategy
  const loadGoalData = async () => {
    if (!goalId) {
      setError('No goal ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setDataSource(null);

    try {
      // Strategy 1: Try backend first if user is authenticated
      if (isUserAuthenticated()) {
        try {
          console.log('🔄 Attempting to load goal from backend...');
          const response = await api.getGoal(goalId as string);

          if (response.success && response.data) {
            console.log('✅ Goal loaded from backend');
            setGoal(response.data);
            setSelectedGoal(response.data);
            setDataSource('backend');
            setLoading(false);
            return;
          } else {
            console.log('⚠️ Backend returned no data, falling back to local');
          }
        } catch (backendError: any) {
          console.log('⚠️ Backend request failed, falling back to local:', backendError.message);
          // Don't set error here, just fall back to local
        }
      }

      // Strategy 2: Try local Dexie database
      try {
        console.log('🔄 Attempting to load goal from local database...');
        const localGoal = await dbUtils.getGoal(goalId as string);

        if (localGoal) {
          console.log('✅ Goal loaded from local database');
          setGoal(localGoal);
          setSelectedGoal(localGoal);
          setDataSource('local');
          setLoading(false);
          return;
        } else {
          console.log('⚠️ Goal not found in local database');
        }
      } catch (localError: any) {
        console.error('❌ Local database error:', localError);
      }

      // Strategy 3: Check if goal exists in store (already loaded)
      if (foundGoal) {
        console.log('✅ Goal found in store');
        setGoal(foundGoal);
        setSelectedGoal(foundGoal);
        setDataSource('local');
        setLoading(false);
        return;
      }

      // Strategy 4: If all else fails, show appropriate error message
      if (isUserAuthenticated()) {
        setError('Goal not found. It may have been deleted from both backend and local storage, or you may not have access to it.');
      } else {
        setError('Goal not found in local storage. Please check if the goal ID is correct.');
      }
      setLoading(false);

    } catch (error: any) {
      console.error('❌ Failed to load goal:', error);
      setError(`Failed to load goal: ${error.message}`);
      setLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!goalId) {
      showToast({ message: "No goal ID available", type: "error", duration: 3000 });
      return;
    }

    try {
      setIsLoadingRecommendations(true);
      const response = await api.getGoalRecommendations(goalId as string);

      if (response.success && response.data) {
        setRecommendations(response.data as any[]);
        setTasksRecommendations(response.data as any[]);
        showToast({ message: "Recommendations loaded successfully", type: "success", duration: 3000 });
      } else {
        console.error("Failed to get recommendations:", response.error);
        showToast({ message: "Failed to load recommendations", type: "error", duration: 3000 });
      }
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      showToast({ message: `Failed to load recommendations: ${error.message}`, type: "error", duration: 3000 });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleAddTask = async (task: Task) => {
    try {
      const response = await addTask({
        title: task.title,
        description: task.description,
        completed: false,
        priority: 'low',
      });

      if (response) {
        showToast({ message: "Task added successfully", type: "success", duration: 3000 });
        setTasksAdded([...tasksAdded, response]);
      } else {
        showToast({ message: "Failed to add task", type: "error", duration: 3000 });
      }
      return response;
    } catch (error: any) {
      console.error("Error adding task:", error);
      showToast({ message: `Failed to add task: ${error.message}`, type: "error", duration: 3000 });
    }
  };

  const handleEditGoal = () => {
    if (!goal) return;

    showModal(
      <GoalEdit
        goal={goal}
        tasks={tasks}
        onSave={(updatedGoal) => {
          setGoal(updatedGoal);
          setSelectedGoal(updatedGoal);
          hideModal();
          showToast({ message: "Goal updated successfully", type: "success" });
        }}
        onCancel={hideModal}
      />
    );
  };

  // Load initial data
  useEffect(() => {
    loadGoals();
    loadTasks();
  }, [loadGoals, loadTasks]);

  // Load goal when goalId changes
  useEffect(() => {
    if (goalId) {
      loadGoalData();
    }
  }, [goalId]);

  // Handle missing goalId
  if (!goalId) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
          <Icon name="search" className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Goal Not Found</h2>
          <p className="text-gray-600">No goal ID was provided in the URL.</p>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <TimeLoading />
          <p className="mt-4 text-gray-600">Loading goal details...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
          <Icon name="search" className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Goal</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <ButtonPrimary onClick={loadGoalData}>
            Try Again
          </ButtonPrimary>
        </div>
      </div>
    );
  }

  // Handle missing goal
  if (!goal) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
          <Icon name="search" className="w-12 h-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Goal Not Found</h2>
          <p className="text-gray-600">The goal you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const handleAddTaskRecommendations = () => {
    const res = tasksRecommendations.map(async (task) => {
      const response = await handleAddTask(task);
      console.log("response", response);
      if (response) {
        setTasksAdded([...tasksAdded, response]);
      }

      setGoal({
        ...goal,
        relatedTaskIds: [...(goal.relatedTaskIds || []), response?.id?.toString() || ""],
      });
      //  if (response) {
      //   handleLinkedToGoal(response);
      //  }
    });

    if (res.length > 0) {
      showToast({ message: "Tasks added successfully", type: "success", duration: 3000 });
      setIsSuggestionsTasksAdded(true);
    } else {
      showToast({ message: "Failed to add tasks", type: "error", duration: 3000 });
    }
  }

  const handleLinkedToGoal = async () => {
    console.log("tasksAdded", tasksAdded);
    console.log("goal", goal);
    if (!goal) return;

    tasksAdded.forEach(async (task) => {
      const response = await updateGoal(goal.id?.toString() || "", {
        relatedTaskIds: [...(goal.relatedTaskIds || []), task.id?.toString() || ""],
      });

      if (response) {
        console.log("response", response);
        showToast({ message: "Task linked to goal successfully", type: "success", duration: 3000 });
      } else {
        showToast({ message: "Failed to link task to goal", type: "error", duration: 3000 });
      }
    });
  }

  const handleUnlinkTask = async (taskId: string) => {
    const response = await updateGoal(goal.id?.toString() || "", {
      relatedTaskIds: [...(goal.relatedTaskIds || []).filter(id => id !== taskId)],
    });

    if (response) {
      showToast({ message: "Task unlinked from goal successfully", type: "success", duration: 3000 });
      setGoal({
        ...goal,
        relatedTaskIds: [...(goal.relatedTaskIds || []).filter(id => id !== taskId)],
      });
    } else {
      showToast({ message: "Failed to unlink task from goal", type: "error", duration: 3000 });
    }
  } 

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Data source indicator */}
      {/* {dataSource && (
        <div className="mb-4 p-2 rounded-lg text-sm">
          {dataSource === 'backend' ? (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-2 rounded">
              <Icon name="home" className="w-4 h-4" />
              <span>Data from backend</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-2 rounded">
              <Icon name="settings" className="w-4 h-4" />
              <span>Data from local storage</span>
            </div>
          )}
        </div>
      )} */}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Goal ID: {goalId}</p>
          <p>Data Source: {dataSource || 'None'}</p>
          <p>Authenticated: {isUserAuthenticated() ? 'Yes' : 'No'}</p>
          <p>Goal Found: {goal ? 'Yes' : 'No'}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-bold">🎯 Goal</h2>
            <ButtonSimple
              onClick={handleEditGoal}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              <Icon name="create" className="w-4 h-4 mr-1" />
              Edit
            </ButtonSimple>
          </div>
          <p className="text-2xl font-bold">{goal.title}</p>
          <p className="text-sm text-gray-500">{goal.description}</p>
          <p className="text-sm text-gray-500">
            Target Date: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'N/A'}
          </p>
          <p className="text-sm text-gray-500">Progress: {goal.progress}%</p>
          <p className="text-sm text-gray-500">
            Status: {goal.completed ? 'Completed' : 'In Progress'}
          </p>
          <p className="text-sm text-gray-500">Category: {goal.category || 'Uncategorized'}</p>
        </div>
      </div>

      {/* Related Tasks Section */}
      <div className="flex flex-col gap-2 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">📋 Related Tasks</h2>
          {relatedTasks.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {relatedTasks.filter(t => t.completed).length} of {relatedTasks.length} completed
            </div>
          )}
        </div>
        {relatedTasks.length > 0 && (
          <div className="w-full rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(relatedTasks.filter(t => t.completed).length / relatedTasks.length) * 100}%`
              }}
            ></div>
          </div>
        )}
        {relatedTasks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {relatedTasks.map((task) => (
              <div key={task.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full ${task.completed
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                      {task.priority && (
                        <span className={`px-2 py-1 rounded-full ${task.priority === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : task.priority === 'medium'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                          {task.priority}
                        </span>
                      )}
                      {task.category && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {task.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/tasks`}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      View Task
                    </Link>
                    {task.id && (
                      <button
                        onClick={() => {
                          handleUnlinkTask(task.id?.toString() || "");
                        }}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                      >
                        Unlink
                      </button>
                    )}
                    {!task.completed && (
                      <button
                        onClick={() => {
                          // TODO: Add task completion toggle functionality
                          showToast({
                            message: `Marking "${task.title}" as completed`,
                            type: "info"
                          });
                        }}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Icon name="list" className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tasks linked to this goal yet.</p>
            <p className="text-sm mt-1">Edit the goal to link tasks or create new tasks.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <ButtonPrimary
          onClick={getRecommendations}
          disabled={isLoadingRecommendations}
        >
          {isLoadingRecommendations ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            "Get Recommendations"
          )}
        </ButtonPrimary>
      </div>

      {tasksRecommendations?.length > 0 && (
        <div className="flex flex-row gap-2 mt-6 justify-end">
          <ButtonSimple onClick={handleAddTaskRecommendations}>Add task recommendations</ButtonSimple>
          <ButtonSimple onClick={handleLinkedToGoal}>Link to goal</ButtonSimple>
        </div>
      )}

 

      {tasksRecommendations.length > 0 && (
        <div className="flex flex-col gap-2 mt-6">
          <h2 className="text-lg font-bold">💡 Recommendations</h2>
          {tasksRecommendations.map((recommendation, index) => (
            <GoalTaskRecommended key={index} recommendation={recommendation}
              onClose={onClose}
              onDelete={onDelete}
              goalProps={goal}
            />
          ))}
        </div>
      )}
    </div>
  );
} 