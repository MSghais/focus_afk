import { create } from 'zustand';
import { User } from '@prisma/client';
import { initializeAuthFromStorage, saveAuthToStorage, clearAuthFromStorage } from '../lib/auth';
import { Task, Goal, Quest } from '../types';

interface RecommendersState {

  setTasksRecommendations: (tasks: Task[]) => void;

  tasksRecommendations: Task[];

  setGoalsRecommendations: (goals: Goal[]) => void;

  goalsRecommendations: Goal[];

  questsRecommendations: Quest[];

  setQuestsRecommendations: (quests: Quest[]) => void;
}

export const useRecommendersStore = create<RecommendersState>((set, get) => ({
  tasksRecommendations: [],
  setTasksRecommendations: (tasks) => set({ tasksRecommendations: tasks }),

  goalsRecommendations: [],
  setGoalsRecommendations: (goals) => set({ goalsRecommendations: goals }),

  questsRecommendations: [],
  setQuestsRecommendations: (quests) => set({ questsRecommendations: quests }),
})); 