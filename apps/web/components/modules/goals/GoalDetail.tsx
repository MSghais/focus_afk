'use client';
import { useEffect, useMemo, useState } from 'react';
import GoalCreate, { GoalFormData, Task as CreateTask } from './GoalCreate';
import { useFocusAFKStore } from '../../../store/store';
import { ButtonPrimary } from '../../small/buttons';
import { Goal, Task } from '../../../types';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
export interface GoalDetailProps {
  goalIdProps?: string;
  goalProps?: Goal;
  onClose?: () => void;
  onDelete?: () => void;
}

export default function GoalDetail({ goalIdProps, goalProps, onClose, onDelete }: GoalDetailProps) {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const { goals, tasks, addGoal, loadGoals, loadTasks, selectedGoal, setSelectedGoal } = useFocusAFKStore();

  const [goal, setGoal] = useState<Goal | null>(goalProps || null);
  let { id } = useParams();
  let goalId = goalIdProps || id;
  const foundGoal = useMemo(() => goals.find(g => Number(g.id) === Number(goalId)), [goals, goalId]);
  const foundTask = useMemo(() => tasks.find(t => Number(t.id) === Number(goal?.relatedTasks?.[0])), [tasks, goal]);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const getRecommendations = async () => {
    try {
      const response = await api.getGoalRecommendations(goalId as string);
      if(response.success && response.data) {
        setRecommendations(response.data as any[]);
      } else {
        console.error("error", response.error);
      }
    } catch (error) {
      console.error("error", error);
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
    return <div>Goal not found</div>;
  }

  if (!foundGoal && !goal) {
    return <div>Goal not found</div>;
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
      }}>
        Get Recommendations
      </ButtonPrimary>  
    </div>
    </div>
  );
} 