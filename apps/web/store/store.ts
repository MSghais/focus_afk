import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { dbUtils } from '../lib/database';
import { useAuthStore } from './auth';
import { Task, Goal, TimerSession, UserSettings } from '../types';
import { api } from '../lib/api';
import { isUserAuthenticated, getJwtToken } from '../lib/auth';

// Timer state interface
interface TimerState {
  isRunning: boolean;
  secondsLeft: number;
  totalSeconds: number;
  currentSessionId?: number;
  isBreak: boolean;
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
}

// UI state interface
interface UIState {
  currentModule: 'dashboard' | 'tasks' | 'timer' | 'focus' | 'goals' | 'mentor' | 'settings' | 'learning';
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

// Main store interface
interface FocusAFKStore {
  // Data
  tasks: Task[];
  goals: Goal[];
  timerSessions: TimerSession[];
  settings: UserSettings | null;

  selectedTask: Task | null;
  selectedGoal: Goal | null;

  // Timer state
  timer: TimerState;

  // UI state
  ui: UIState;

  // Loading states
  loading: {
    tasks: boolean;
    goals: boolean;
    sessions: boolean;
    settings: boolean;
  };

  // Actions - Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: number, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  toggleTaskComplete: (id: number) => Promise<void>;
  loadTasks: () => Promise<void>;
  syncTasksToBackend: () => Promise<void>;

  // Actions - Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: number, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  updateGoalProgress: (id: number, progress: number) => Promise<void>;
  loadGoals: () => Promise<void>;

  // Actions - Timer
  startTimerFocus: (taskId?: number, goalId?: number) => Promise<void>;
  startTimer: (duration: number, taskId?: number, goalId?: number, type?: 'focus' | 'break' | "deep") => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  stopTimeFocus: (completed?: boolean, taskId?: number, goalId?: number, duration?: number) => Promise<void>;
  resetTimer: () => void;
  setTimerDuration: (seconds: number) => void;
  // Break

  loadTimerSessions: () => Promise<void>;

  // Actions - Settings
  updateSettings: (settings: Partial<Omit<UserSettings, 'id' | 'createdAt'>>) => Promise<void>;
  loadSettings: () => Promise<void>;

  // Actions - UI
  setCurrentModule: (module: UIState['currentModule']) => void;
  getBreakStats: (days?: number) => Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    sessionsByDay: { date: string; sessions: number; minutes: number }[];
  }>;

  getDeepFocusStats: (days?: number) => Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    sessionsByDay: { date: string; sessions: number; minutes: number }[];
  }>;
  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
  setNotifications: (enabled: boolean) => void;

  // Actions - Loading
  setLoading: (key: keyof FocusAFKStore['loading'], value: boolean) => void;

  // Statistics
  getTaskStats: () => Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }>;

  getFocusStats: (days?: number) => Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    sessionsByDay: { date: string; sessions: number; minutes: number }[];
  }>;
}

// Default timer state
const defaultTimerState: TimerState = {
  isRunning: false,
  secondsLeft: 25 * 60, // 25 minutes
  totalSeconds: 25 * 60,
  currentSessionId: undefined,
  isBreak: false,
  autoStartBreaks: false,
  autoStartSessions: false,
};

// Default UI state
const defaultUIState: UIState = {
  currentModule: 'dashboard',
  sidebarOpen: false,
  theme: 'auto',
  notifications: true,
};

// Create the store
export const useFocusAFKStore = create<FocusAFKStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tasks: [],
    goals: [],
    timerSessions: [],
    settings: null,
    timer: defaultTimerState,
    ui: defaultUIState,
    loading: {
      tasks: false,
      goals: false,
      sessions: false,
      settings: false,
    },

    selectedTask: null,
    selectedGoal: null,   

    setSelectedTask: (task: Task | null) => {
      set({ selectedTask: task });
    },
    setSelectedGoal: (goal: Goal | null) => {
      set({ selectedGoal: goal });
    },  

    // Timer actions
    startTimerFocus: async (taskId, goalId) => {
      const { settings } = get();
      const duration = (settings?.defaultFocusDuration || 25) * 60;
      const { isAuthenticated, userConnected, token } = useAuthStore.getState();
      const userId = userConnected?.id || '';
      const sessionId = await dbUtils.addSession({
        type: 'focus',
        taskId: taskId ? taskId.toString() : undefined,
        goalId: goalId ? goalId.toString() : undefined,
        userId: userId,
        startTime: new Date().toISOString(),
        duration: 0,
        completed: false,
      });
      set((state) => ({
        timer: {
          ...state.timer,
          isRunning: true,
          secondsLeft: duration,
          totalSeconds: duration,
          currentSessionId: sessionId,
          isBreak: false,
        },
      }));
    },


    // Task actions
    addTask: async (task) => {
      // Always add to local DB
      const id = await dbUtils.addTask(task);
      const newTask = { ...task, id, createdAt: new Date(), updatedAt: new Date() };
      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));

      // If authenticated, also send to backend
      if (isUserAuthenticated()) {
        try {
          const token = getJwtToken();
          if (token) {
            await api.createTask({
              ...task,
              // Add any required fields for backend
            });
            console.log('✅ Task synced to backend');
          }
        } catch (err) {
          console.error('❌ Failed to sync task to backend:', err);
          // Optionally handle error (e.g., show toast)
        }
      }
    },

    updateTask: async (id, updates) => {
      await dbUtils.updateTask(id, updates);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
        ),
      }));

      // If authenticated, also update in backend
      if (isUserAuthenticated()) {
        try {
          const token = getJwtToken();
          if (token) {
            await api.updateTask(id.toString(), updates);
            console.log('✅ Task update synced to backend');
          }
        } catch (err) {
          console.error('❌ Failed to sync task update to backend:', err);
        }
      }
    },

    deleteTask: async (id) => {
      await dbUtils.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));

      // If authenticated, also delete from backend
      if (isUserAuthenticated()) {
        try {
          const token = getJwtToken();
          if (token) {
            await api.deleteTask(id.toString());
            console.log('✅ Task deletion synced to backend');
          }
        } catch (err) {
          console.error('❌ Failed to sync task deletion to backend:', err);
        }
      }
    },

    toggleTaskComplete: async (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (task) {
        await get().updateTask(id, { completed: !task.completed });
      }
    },

    loadTasks: async () => {
      set((state) => ({ loading: { ...state.loading, tasks: true } }));
      try {
        const tasks = await dbUtils.getTasks();
        set({ tasks });
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        set((state) => ({ loading: { ...state.loading, tasks: false } }));
      }
    },

    // Sync all local tasks to backend
    syncTasksToBackend: async () => {
      if (!isUserAuthenticated()) {
        console.log('⚠️ Not authenticated, skipping task sync');
        return;
      }

      try {
        const token = getJwtToken();
        if (!token) {
          console.log('⚠️ No JWT token available, skipping task sync');
          return;
        }

        const { tasks } = get();
        console.log(`🔄 Syncing ${tasks.length} tasks to backend...`);

        for (const task of tasks) {
          console.log(`🔄 Processing task: ${task.id} - ${task.title}`);
          
          try {
            // Check if task exists in backend
            console.log(`🔄 Checking if task ${task.id} exists in backend...`);
            await api.getTask(task.id!.toString());
            console.log(`🔄 Task ${task.id} exists, updating...`);
            
            // If it exists, update it
            await api.updateTask(task.id!.toString(), {
              title: task.title,
              description: task.description,
              priority: task.priority,
              category: task.category,
              completed: task.completed,
              dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
              estimatedMinutes: task.estimatedMinutes,
            } as any);
            console.log(`✅ Task ${task.id} updated successfully`);
          } catch (error) {
            console.log(`🔄 Task ${task.id} not found in backend, creating...`);
            // If task doesn't exist, create it
            await api.createTask({
              title: task.title,
              description: task.description,
              priority: task.priority,
              category: task.category,
              completed: task.completed,
              dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
              estimatedMinutes: task.estimatedMinutes,
            } as any);
            console.log(`✅ Task ${task.id} created successfully`);
          }
        }

        console.log('✅ All tasks synced to backend successfully');
      } catch (error) {
        console.error('❌ Failed to sync tasks to backend:', error);
      }
    },

    // Goal actions
    addGoal: async (goal) => {
      const id = await dbUtils.addGoal(goal);
      const newGoal = { ...goal, id, createdAt: new Date(), updatedAt: new Date() };
      set((state) => ({
        goals: [newGoal, ...state.goals],
      }));
    },

    updateGoal: async (id, updates) => {
      await dbUtils.updateGoal(id, updates);
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === id ? { ...goal, ...updates, updatedAt: new Date() } : goal
        ),
      }));
    },

    deleteGoal: async (id) => {
      await dbUtils.deleteGoal(id);
      set((state) => ({
        goals: state.goals.filter((goal) => goal.id !== id),
      }));
    },

    updateGoalProgress: async (id, progress) => {
      const goal = get().goals.find((g) => g.id === id);
      if (goal) {
        const completed = progress >= 100;
        await get().updateGoal(id, { progress, completed });
      }
    },

    loadGoals: async () => {
      set((state) => ({ loading: { ...state.loading, goals: true } }));
      try {
        const goals = await dbUtils.getGoals();
        set({ goals });
      } catch (error) {
        console.error('Failed to load goals:', error);
      } finally {
        set((state) => ({ loading: { ...state.loading, goals: false } }));
      }
    },

    // Timer actions
    startTimer: async (duration, taskId, goalId, type) => {
      // Local DB
      // Backend sync if signed in

      const { isAuthenticated, userConnected, token } = useAuthStore.getState();
      console.log("isAuthenticated", isAuthenticated);

      const userId = userConnected?.id || '';
      const sessionId = await dbUtils.addSession({
        type: type || 'focus',
        taskId: taskId ? taskId.toString() : undefined,
        goalId: goalId ? goalId.toString() : undefined,
        startTime: new Date().toISOString(),
        duration: 0,
        completed: false,
        userId: userId
      });
      set((state) => ({
        timer: {
          ...state.timer,
          isRunning: true,
          secondsLeft: duration,
          totalSeconds: duration,
          currentSessionId: sessionId,
          isBreak: false,
        },
      }));



      if (isAuthenticated && userConnected && userConnected.id && token) {
        try {
          await api.createTimerSession({
            taskId: taskId ? taskId.toString() : undefined,
            goalId: goalId ? goalId.toString() : undefined,
            startTime: new Date().toISOString(),
            duration: 0,
            completed: false,
            type: type || 'focus'
          }, token);
        } catch (err) {
          // Optionally handle error
        }
      }
    },

    pauseTimer: () => {
      set((state) => ({
        timer: { ...state.timer, isRunning: false },
      }));
    },

    resumeTimer: () => {
      set((state) => ({
        timer: { ...state.timer, isRunning: true },
      }));
    },

    stopTimer: async () => {
      const { timer } = get();
      if (timer.currentSessionId) {
        const duration = timer.totalSeconds - timer.secondsLeft;
        await dbUtils.updateSession(timer.currentSessionId, {
          endTime: new Date().toISOString(),
          duration,
          completed: true,
        });
      }
      set((state) => ({
        timer: {
          ...defaultTimerState,
          autoStartBreaks: state.timer.autoStartBreaks,
          autoStartSessions: state.timer.autoStartSessions,
        },
      }));
    },

    stopTimeFocus: async (completed = true, taskId, goalId, duration?: number) => {
      const { timer } = get();
      if (timer.currentSessionId) {
        const sessionDuration = duration || (timer.totalSeconds - timer.secondsLeft);
        await dbUtils.updateSession(timer.currentSessionId, {
          endTime: new Date().toISOString(),
          duration: sessionDuration,
          completed: completed,
          taskId: taskId ? taskId.toString() : undefined,
          goalId: goalId ? goalId.toString() : undefined,
        });
      }
    },



    resetTimer: () => {
      set((state) => ({
        timer: {
          ...state.timer,
          isRunning: false,
          secondsLeft: state.timer.totalSeconds,
        },
      }));
    },

    setTimerDuration: (seconds) => {
      set((state) => ({
        timer: {
          ...state.timer,
          secondsLeft: seconds,
          totalSeconds: seconds,
        },
      }));
    },


    loadTimerSessions: async () => {
      set((state) => ({ loading: { ...state.loading, sessions: true } }));
      try {
        const timerSessions = await dbUtils.getSessions();
        set({ timerSessions });
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        set((state) => ({ loading: { ...state.loading, sessions: false } }));
      }
    },

    // Settings actions
    updateSettings: async (settings) => {
      await dbUtils.updateSettings(settings);
      set((state) => ({
        settings: state.settings
          ? {
              ...state.settings,
              ...settings,
              updatedAt: new Date().toISOString(),
            }
          : null,
      }));
    },

    loadSettings: async () => {
      set((state) => ({ loading: { ...state.loading, settings: true } }));
      try {
        const settings = await dbUtils.getSettings();
        if (settings) {
          set({ settings });
          // Update timer state with settings
          set((state) => ({
            timer: {
              ...state.timer,
              autoStartBreaks: settings.autoStartBreaks,
              autoStartSessions: settings.autoStartSessions,
            },
            ui: {
              ...state.ui,
              theme: settings.theme,
              notifications: settings.notifications,
            },
          }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        set((state) => ({ loading: { ...state.loading, settings: false } }));
      }
    },

    // UI actions
    setCurrentModule: (module) => {
      set((state) => ({
        ui: { ...state.ui, currentModule: module },
      }));
    },

    toggleSidebar: () => {
      set((state) => ({
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
      }));
    },

    setTheme: (theme) => {
      set((state) => ({
        ui: { ...state.ui, theme },
      }));
      get().updateSettings({ theme });
    },

    setNotifications: (enabled) => {
      set((state) => ({
        ui: { ...state.ui, notifications: enabled },
      }));
      get().updateSettings({ notifications: enabled });
    },

    // Loading actions
    setLoading: (key, value) => {
      set((state) => ({
        loading: { ...state.loading, [key]: value },
      }));
    },

    // Statistics
    getTaskStats: async () => {
      return await dbUtils.getTaskStats();
    },

    getFocusStats: async (days = 7) => {
      return await dbUtils.getFocusStats(days);
    },

    getBreakStats: async (days = 7) => {
      return await dbUtils.getBreakStats(days);
    },

    getDeepFocusStats: async (days = 7) => {
      return await dbUtils.getDeepFocusStats(days);
    },

    // startTimerBreak: async (duration = 0, taskId, goalId, timeBreak) => {
    //   const sessionId = await dbUtils.addTimerBreakSession({
    //     ...timeBreak,
    //     taskId,
    //     goalId,
    //     startTime: new Date(),
    //     duration: 0,
    //     completed: false,
    //   });

    //   set((state) => ({
    //     timer: {
    //       ...state.timer,
    //       isRunning: true,
    //       secondsLeft: duration,
    //       totalSeconds: duration,
    //       currentSessionId: sessionId,
    //       isBreak: false,
    //     },
    //   }));
    // },

    // stopTimerBreak: async (completed = false, timeBreak) => {
    //   const { timer } = get();
    //   if (timer.currentSessionId) {
    //     const duration = timer.totalSeconds - timer.secondsLeft;
    //     await dbUtils.updateTimerBreakSession(timer.currentSessionId, {
    //       endTime: new Date(),
    //       duration,
    //       completed: completed,
    //     });
    //   }
    // },
  }))
);

// Timer effect - handle countdown
let timerInterval: NodeJS.Timeout | null = null;

useFocusAFKStore.subscribe(
  (state) => state.timer.isRunning,
  (isRunning) => {
    if (isRunning) {
      timerInterval = setInterval(() => {
        const { timer } = useFocusAFKStore.getState();
        if (timer.secondsLeft > 0) {
          useFocusAFKStore.setState((state) => ({
            timer: { ...state.timer, secondsLeft: timer.secondsLeft - 1 },
          }));
        } else {
          // Timer finished
          clearInterval(timerInterval!);
          useFocusAFKStore.getState().stopTimer();

          // Show notification if enabled
          if (useFocusAFKStore.getState().ui.notifications) {
            if (Notification.permission === 'granted') {
              new Notification('Focus Session Complete!', {
                body: timer.isBreak ? 'Break time is over!' : 'Great job! Take a break.',
                icon: '/favicon.ico',
              });
            }
          }
        }
      }, 1000);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
);

// Initialize store on mount
export const initializeStore = async () => {
  const store = useFocusAFKStore.getState();
  await Promise.all([
    store.loadTasks(),
    store.loadGoals(),
    store.loadTimerSessions(),
    store.loadSettings(),
  ]);
}; 