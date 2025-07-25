'use client';
import { useEffect, useMemo, useState } from 'react';
import GoalCreate, { GoalFormData, Task as CreateTask } from './GoalCreate';
import { useFocusAFKStore } from '../../../store/store';
import { ButtonPrimary, ButtonSimple } from '../../small/buttons';
import { Goal, Task } from '../../../types';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import TimeLoading from '../../small/loading/time-loading';
export interface GoalDetailProps {
  goalIdProps?: string;
  goalProps?: Goal;
  onClose?: () => void;
  onDelete?: () => void;
}

export default function GoalDetail({ goalIdProps, goalProps, onClose, onDelete }: GoalDetailProps) {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const { goals, tasks, addGoal, loadGoals, loadTasks, selectedGoal, setSelectedGoal , addTask} = useFocusAFKStore();

  const [goal, setGoal] = useState<Goal | null>(goalProps || null);
  let { id } = useParams();
  let goalId = goalIdProps || id;
  const foundGoal = useMemo(() => goals.find(g => Number(g.id) === Number(goalId)), [goals, goalId]);
  const foundTask = useMemo(() => tasks.find(t => Number(t.id) === Number(goal?.relatedTasks?.[0])), [tasks, goal]);

  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const getRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const response = await api.getGoalRecommendations(goalId as string);
      console.log("response", response);
      if(response.success && response.data) {
        setRecommendations(response.data as any[]);
      } else {
        console.error("error", response.error);
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  if(!selectedGoal) {
  }
  // console.log("goalIdProps", goalIdProps);
  // console.log("paramsId", id);
  // console.log("goalId", goalId);
  // console.log("foundGoal", foundGoal);
  // console.log("goal", goal);

  // console.log("goalProps", goalProps);
  // console.log("goals", goals);

  const loadGoal =  async () => {
    if(!goalId) {
      return;
    }
    const goal = await api.getGoal(goalId as string);
    // console.log("goal", goal);
    if(goal.data) {
      setSelectedGoal(goal.data);
      setGoal(goal.data);
    }
  }
  useEffect(() => {
    loadGoals();


  }, [loadGoals]);

  useEffect(() => {
    if(goalId) {
      loadGoal();
    }
  }, [goalId]);

  if (!goalIdProps) {
    goalId = id;
  }
  if (!goalId) {
    return <div>Goal not found

      <TimeLoading />
    </div>;
  }

  const handleAddTask = async (task: Task) => {
    const response = await addTask({
      title: task.title,
      description: task.description,
      completed: false,
      priority: 'low',
      // category: "",
      // goalId: Number(goalId as string),
      // status: 'pending',
      // priority: 'low',
      // category: 'other',
      // tags: [],
    });
    // if(response.success && response.data) {
    //   loadTasks();
    // }
  }

  if (!foundGoal && !goal) {
    return <div>Goal not found

      <TimeLoading />
    </div>;
  }
  // useEffect(() => {
  //   if (selectedGoal) {
  //     setSelectedGoal(null);
  //   }
  // }, [selectedGoal, setSelectedGoal]);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
   
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">🎯 Goal</h2>
          <p className="text-2xl font-bold">{goal?.title}</p>
          <p className="text-sm text-gray-500">{goal?.description}</p>
          <p className="text-sm text-gray-500">Target Date: {goal?.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'N/A'}</p>
          <p className="text-sm text-gray-500">Progress: {goal?.progress}%</p>
          <p className="text-sm text-gray-500">Status: {goal?.completed ? 'Completed' : 'In Progress'}</p>
          <p className="text-sm text-gray-500">Category: {goal?.category}</p>
          {/* <p className="text-sm text-gray-500">Related Tasks: {goal?.relatedTasks?.map(task => task).join(', ')}</p> */}
        </div>
      </div>


    <div className="flex flex-col gap-2"> 
      <ButtonPrimary onClick={() => {
        getRecommendations();
      }} disabled={isLoadingRecommendations}>
        {isLoadingRecommendations ? <TimeLoading /> : "Get Recommendations"}
      </ButtonPrimary>  
    </div>
    

    {recommendations.length > 0 && (
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">🎯 Recommendations</h2>
        {recommendations.map((recommendation, index) => (
          <div key={index}>
            <p className="text-lg font-bold">{recommendation.title}</p> 
            <p className="text-sm text-gray-500">{recommendation.description}</p> 

            <ButtonSimple className="w-full" onClick={() => {
              handleAddTask(recommendation);
            }}>
              Add Task
            </ButtonSimple>
          </div>
        ))}
      </div>
    )}
    </div>
  );
} 