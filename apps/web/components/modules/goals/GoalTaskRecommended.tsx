'use client';
import { useEffect, useMemo, useState } from 'react';
import GoalCreate, { GoalFormData, Task as CreateTask } from './GoalCreate';
import { useFocusAFKStore } from '../../../store/store';
import { ButtonPrimary, ButtonSimple } from '../../small/buttons';
import { Goal, Task } from '../../../types';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import TimeLoading from '../../small/loading/time-loading';
import { useRecommendersStore } from '../../../store/recommenders';
import { useUIStore } from '../../../store/uiStore';
import { Icon } from '../../small/icons';
import { isUserAuthenticated } from '../../../lib/auth';
import { dbUtils } from '../../../lib/database';
import Link from 'next/link';

export interface GoalTaskRecommendedProps {
  goalIdProps?: string;
  goalProps?: Goal;
  onClose?: () => void;
  onDelete?: () => void;
  recommendation?: any;
}

export default function GoalTaskRecommended({ goalIdProps, goalProps, onClose, onDelete, recommendation }: GoalTaskRecommendedProps) {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const { goals, tasks, addGoal, loadGoals, loadTasks, selectedGoal, setSelectedGoal, addTask } = useFocusAFKStore();

  const [isTaskAdded, setIsTaskAdded] = useState<boolean>(false);
  const { showToast } = useUIStore();
  const { setTasksRecommendations, tasksRecommendations } = useRecommendersStore();
  const [goal, setGoal] = useState<Goal | null>(goalProps || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'backend' | 'local' | null>(null);

  let { id } = useParams();
  let goalId = goalIdProps || id;


  const [backendTask, setBackendTask] = useState<Task | null>(null);
  const foundGoal = useMemo(() => goals.find(g => Number(g.id) === Number(goalId)), [goals, goalId]);
  const foundTask = useMemo(() => tasks.find(t => Number(t.id) === Number(goal?.relatedTasks?.[0])), [tasks, goal]);

  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);


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

      console.log("response", response);

      if (response) {
        showToast({ message: "Task added successfully", type: "success", duration: 3000 });
        setIsTaskAdded(true);
        setBackendTask(response);
      } else {
        showToast({ message: "Failed to add task", type: "error", duration: 3000 });
      }
    } catch (error: any) {
      console.error("Error adding task:", error);
      showToast({ message: `Failed to add task: ${error.message}`, type: "error", duration: 3000 });
    }
  };

  // // Load initial data
  // useEffect(() => {
  //   loadGoals();
  //   loadTasks();
  // }, [loadGoals, loadTasks]);

  // // Load goal when goalId changes
  // useEffect(() => {
  //   if (goalId) {
  //     loadGoalData();
  //   }
  // }, [goalId]);

  // // Handle missing goalId
  // if (!goalId) {
  //   return (
  //     <div className="w-full max-w-2xl mx-auto p-4">
  //       <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
  //                    <Icon name="search" className="w-12 h-12 text-red-500 mb-4" />
  //         <h2 className="text-xl font-bold text-gray-800 mb-2">Goal Not Found</h2>
  //         <p className="text-gray-600">No goal ID was provided in the URL.</p>
  //       </div>
  //     </div>
  //   );
  // }

  // // Handle loading state
  // if (loading) {
  //   return (
  //     <div className="w-full max-w-2xl mx-auto p-4">
  //       <div className="flex flex-col items-center justify-center min-h-[200px]">
  //         <TimeLoading />
  //         <p className="mt-4 text-gray-600">Loading goal details...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Handle error state
  // if (error) {
  //   return (
  //     <div className="w-full max-w-2xl mx-auto p-4">
  //       <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
  //                    <Icon name="search" className="w-12 h-12 text-red-500 mb-4" />
  //         <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Goal</h2>
  //         <p className="text-gray-600 mb-4">{error}</p>
  //         <ButtonPrimary onClick={loadGoalData}>
  //           Try Again
  //         </ButtonPrimary>
  //       </div>
  //     </div>
  //   );
  // }

  // Handle missing goal
  // if (!goal) {
  //   return (
  //     <div className="w-full max-w-2xl mx-auto p-4">
  //       <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
  //         <Icon name="search" className="w-12 h-12 text-gray-400 mb-4" />
  //         <h2 className="text-xl font-bold text-gray-800 mb-2">Goal Not Found</h2>
  //         <p className="text-gray-600">The goal you're looking for doesn't exist or you don't have access to it.</p>
  //       </div>
  //     </div>
  //   );
  // }

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



      <div className="border rounded-lg p-4">
        <p className="text-lg font-bold">{recommendation.title}</p>
        <p className="text-sm text-gray-500 mb-3">{recommendation.description}</p>

        <div className="flex flex-row gap-2 mt-6 justify-between items-center">


          {!isTaskAdded && (
            <ButtonSimple
              className="w-full"
              onClick={() => handleAddTask(recommendation)}
            >
              {isTaskAdded ? "Task Added" : "Add Task"}
            </ButtonSimple>
          )}

          {isTaskAdded && backendTask && (
            <Link href={`/tasks/${backendTask?.id}`}
              className="w-full border rounded-lg p-2"
            >
              View Task
            </Link>
          )}
          {/* <ButtonPrimary
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
          </ButtonPrimary> */}
        </div>

      </div>


    </div>
  );
} 