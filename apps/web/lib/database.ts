import Dexie, { Table } from 'dexie';
import { Task, Goal, TimerSession, UserSettings } from '../types';


// Database class
export class FocusAFKDatabase extends Dexie {
  tasks!: Table<Task>;
  goals!: Table<Goal>;
  timerSessions!: Table<TimerSession>;
  userSettings!: Table<UserSettings>;

  constructor() {
    super('FocusAFKDatabase');

    this.version(1).stores({
      tasks: '++id, title, completed, priority, category, dueDate, createdAt, subTaskId',
      goals: '++id, title, completed, category, targetDate, createdAt',
      timerSessions: '++id, type, taskId, goalId, startTime, endTime, completed, createdAt, syncedToBackend, backendId',
      userSettings: '++id, updatedAt'
    });
  }
}

// Create and export database instance
export const db = new FocusAFKDatabase();

// Database utility functions
export const dbUtils = {
  // Task operations
  async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    return await db.tasks.add({
      ...task,
      createdAt: now,
      updatedAt: now
    });
  },

  async updateTask(id: string | number, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
    const idNum = typeof id === 'string' ? parseInt(id) : id;
    await db.tasks.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  async deleteTask(id: number): Promise<void> {
    await db.tasks.delete(id);
  },

  async getTasks(filters?: {
    completed?: boolean;
    priority?: Task['priority'];
    category?: string;
  }): Promise<Task[]> {
    let collection = db.tasks.toCollection();

    if (filters?.completed !== undefined) {
      collection = collection.filter(task => task.completed === filters.completed);
    }
    if (filters?.priority) {
      collection = collection.filter(task => task.priority === filters.priority);
    }
    if (filters?.category) {
      collection = collection.filter(task => task.category === filters.category);
    }

    return await collection.reverse().sortBy('createdAt');
  },

  async getTask(id: string | number): Promise<Task | undefined> {
    const idNum = typeof id === 'string' ? parseInt(id) : id;
    return await db.tasks.get(idNum);
  },

  // Goal operations
  async addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    return await db.goals.add({
      ...goal,
      createdAt: now,
      updatedAt: now
    });
  },

  async updateGoal(id: number, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<void> {
    await db.goals.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  async deleteGoal(id: number): Promise<void> {
    await db.goals.delete(id);
  },

  async getGoals(filters?: {
    completed?: boolean;
    category?: string;
  }): Promise<Goal[]> {
    let collection = db.goals.toCollection();

    if (filters?.completed !== undefined) {
      collection = collection.filter(goal => goal.completed === filters.completed);
    }
    if (filters?.category) {
      collection = collection.filter(goal => goal.category === filters.category);
    }

    return await collection.reverse().sortBy('createdAt');
  },

  async getGoal(id: string | number): Promise<Goal | undefined> {
    const goalId = typeof id === 'string' ? parseInt(id) : id;
    return await db.goals.get(goalId);
  },

  // Session operations
  async addSession(session: Omit<TimerSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    return await db.timerSessions.add({
      ...session,
      createdAt: new Date().toISOString()
    });
  },

  async updateSession(id: number, updates: Partial<Omit<TimerSession, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    await db.timerSessions.update(id, {
      ...updates,
        updatedAt: new Date().toISOString()
    });
  },

  async getSessions(filters?: {
    type?: TimerSession['type'];
    taskId?: number;
    goalId?: number;
    completed?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TimerSession[]> {
    let collection = db.timerSessions.toCollection();
    if (filters?.type) collection = collection.filter(s => s.type === filters.type);
    if (filters?.taskId) collection = collection.filter(s => s.taskId === filters.taskId);
    if (filters?.goalId) collection = collection.filter(s => s.goalId === filters.goalId);
    if (filters?.completed !== undefined) collection = collection.filter(s => s.completed === filters.completed);
    if (filters?.startDate) collection = collection.filter(s => new Date(s.startTime) >= filters.startDate!);
    if (filters?.endDate) collection = collection.filter(s => new Date(s.startTime) <= filters.endDate!);
    return await collection.reverse().sortBy('startTime');
  },

  async getSession(id: number): Promise<TimerSession | undefined> {
    return await db.timerSessions.get(id);
  },

  // User settings operations
  async getSettings(): Promise<UserSettings | undefined> {
    return await db.userSettings.toCollection().first();
  },

  async updateSettings(settings: Partial<Omit<UserSettings, 'id' | 'createdAt'>>): Promise<void> {
    const existing = await this.getSettings();
    if (existing) {
      await db.userSettings.update(existing.id!, {
        ...settings,
        updatedAt: new Date().toISOString()
      });
    } else {
      await db.userSettings.add({
        defaultFocusDuration: 25,
        defaultBreakDuration: 5,
        autoStartBreaks: false,
        autoStartSessions: false,
        notifications: true,
        theme: 'auto',
        ...settings,
        updatedAt: new Date().toISOString(),
        userId: '' // Ensure userId is always a string to match type
      });
    }
  },

  // Statistics and analytics
  async getTaskStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const tasks = await db.tasks.toArray();
    const now = new Date();

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed && (!t.dueDate || t.dueDate > now)).length,
      overdue: tasks.filter(t => !t.completed && t.dueDate && t.dueDate < now).length
    };
  },

  async getFocusStats(days: number = 7): Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    sessionsByDay: { date: string; sessions: number; minutes: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await this.getSessions({
      type: 'focus',
      completed: true,
      startDate
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const averageSessionLength = sessions.length > 0 ? totalMinutes / sessions.length : 0;

    // Group by day
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.sessions++;
        existing.minutes += session.duration / 60;
      } else {
        acc.push({
          date: date!,
          sessions: 1,
          minutes: session.duration / 60
        });
      }
      return acc;
    }, [] as { date: string; sessions: number; minutes: number }[]);

    return {
      totalSessions: sessions.length,
      totalMinutes,
      averageSessionLength,
      sessionsByDay
    };
  },

  async getDeepFocusStats(days: number = 7): Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    sessionsByDay: { date: string; sessions: number; minutes: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await this.getSessions({
      type: 'deep',
      completed: true,
      startDate
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const averageSessionLength = sessions.length > 0 ? totalMinutes / sessions.length : 0;


    // Group by day
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.sessions++;
        existing.minutes += session.duration / 60;
      } else {
        acc.push({
          date: date!,
          sessions: 1,
          minutes: session.duration / 60
        });
      }
      return acc;
    }, [] as { date: string; sessions: number; minutes: number }[]);

    return {
      totalSessions: sessions.length,
      totalMinutes,
      averageSessionLength,
      sessionsByDay
    };
  },

  async getBreakStats(days: number = 7): Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    sessionsByDay: { date: string; sessions: number; minutes: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await this.getSessions({
      type: 'break',
      completed: true,
      startDate
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const averageSessionLength = sessions.length > 0 ? totalMinutes / sessions.length : 0;

    // Group by day
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.sessions++;
        existing.minutes += session.duration / 60;
          } else {
        acc.push({
          date: date!,
          sessions: 1,
          minutes: session.duration / 60
        });
      }
      return acc;
    }, [] as { date: string; sessions: number; minutes: number }[]);

    return {
      totalSessions: sessions.length,
      totalMinutes,
      averageSessionLength,
      sessionsByDay
    };
  }
}; 