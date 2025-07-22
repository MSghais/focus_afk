import Dexie, { Table } from 'dexie';

// Types for our database entities
export interface Task {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  estimatedMinutes?: number;
  actualMinutes?: number;
}

export interface Goal {
  id?: number;
  title: string;
  description?: string;
  targetDate?: Date;
  completed: boolean;
  progress: number; // 0-100
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  relatedTasks?: number[]; // Task IDs
}

export interface TimerSession {
  id?: number;
  taskId?: number;
  goalId?: number;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  completed: boolean;
  notes?: string;
  createdAt: Date;
}

export interface TimerFocusSession {
  id?: number;
  taskId?: number;
  goalId?: number;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  completed: boolean;
  notes?: string;
  createdAt: Date;
}

export interface TimerBreakSession {
  id?: number;
  taskId?: number;
  goalId?: number;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  completed: boolean;
  createdAt: Date;
  isHavingFun?: boolean;
  activities?: string[];
  persons?: string[];
  location?: string;
  weather?: string;
  mood?: string;
  energyLevel?: string;
  productivityLevel?: string;
  notes?: string;
}


export interface UserSettings {
  id?: number;
  defaultFocusDuration: number; // in minutes
  defaultBreakDuration: number; // in minutes
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  updatedAt: Date;
}

// Database class
export class FocusAFKDatabase extends Dexie {
  tasks!: Table<Task>;
  goals!: Table<Goal>;
  timerSessions!: Table<TimerSession>;
  timerFocusSessions!: Table<TimerFocusSession>;
  timerBreakSessions!: Table<TimerBreakSession>;
  userSettings!: Table<UserSettings>;

  constructor() {
    super('FocusAFKDatabase');

    this.version(1).stores({
      tasks: '++id, title, completed, priority, category, dueDate, createdAt',
      goals: '++id, title, completed, category, targetDate, createdAt',
      timerSessions: '++id, taskId, goalId, startTime, endTime, completed, createdAt',
      timerFocusSessions: '++id, taskId, goalId, startTime, endTime, completed, createdAt',
      timerBreakSessions: '++id, taskId, goalId, startTime, endTime, completed, createdAt',
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

  async updateTask(id: number, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
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

  // Timer session operations
  async addTimerSession(session: Omit<TimerSession, 'id' | 'createdAt'>): Promise<number> {
    return await db.timerSessions.add({
      ...session,
      createdAt: new Date()
    });
  },

  async addTimerBreakSession(session: Omit<TimerBreakSession, 'id' | 'createdAt'>): Promise<number> {
    return await db.timerBreakSessions.add({
      ...session,
      createdAt: new Date()
    });
  },

  async updateTimerBreakSession(id: number, updates: Partial<Omit<TimerBreakSession, 'id' | 'createdAt'>>): Promise<void> {
    await db.timerBreakSessions.update(id, updates);
  },

  // Timer session operations
  async addTimeFocusSession(session: Omit<TimerFocusSession, 'id' | 'createdAt'>): Promise<number> {
    return await db.timerFocusSessions.add({
      ...session,
      createdAt: new Date()
    });
  },

  async updateTimerSession(id: number, updates: Partial<Omit<TimerSession, 'id' | 'createdAt'>>): Promise<void> {
    await db.timerSessions.update(id, updates);
  },

  async updateTimerFocusSession(id: number, updates: Partial<Omit<TimerFocusSession, 'id' | 'createdAt'>>): Promise<void> {
    await db.timerFocusSessions.update(id, updates);
  },

  async getTimerSessions(filters?: {
    taskId?: number;
    goalId?: number;
    completed?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TimerSession[]> {
    let collection = db.timerSessions.toCollection();

    if (filters?.taskId) {
      collection = collection.filter(session => session.taskId === filters.taskId);
    }
    if (filters?.goalId) {
      collection = collection.filter(session => session.goalId === filters.goalId);
    }
    if (filters?.completed !== undefined) {
      collection = collection.filter(session => session.completed === filters.completed);
    }
    if (filters?.startDate) {
      collection = collection.filter(session => session.startTime >= filters.startDate!);
    }
    if (filters?.endDate) {
      collection = collection.filter(session => session.startTime <= filters.endDate!);
    }

    return await collection.reverse().sortBy('startTime');
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
        updatedAt: new Date()
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
        updatedAt: new Date()
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

    const sessions = await this.getTimerSessions({
      completed: true,
      startDate
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const averageSessionLength = sessions.length > 0 ? totalMinutes / sessions.length : 0;

    // Group by day
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = session.startTime.toISOString().split('T')[0];
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


  async getTimerBreakSessions(filters?: {
    taskId?: number;
    goalId?: number;
    completed?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TimerBreakSession[]> {
    let collection = db.timerBreakSessions.toCollection();

    if (filters?.taskId) {
      collection = collection.filter(session => session.taskId === filters.taskId);
    }
    if (filters?.goalId) {
      collection = collection.filter(session => session.goalId === filters.goalId);
    }
    if (filters?.completed !== undefined) {
      collection = collection.filter(session => session.completed === filters.completed);
    }
    if (filters?.startDate) {
      collection = collection.filter(session => session.startTime >= filters.startDate!);
    }
    if (filters?.endDate) {
      collection = collection.filter(session => session.startTime <= filters.endDate!);
    }

    return await collection.reverse().sortBy('startTime');
  },

  async getTimerFocusSessions(filters?: {
    taskId?: number;
    goalId?: number;
    completed?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TimerFocusSession[]> {
    let collection = db.timerFocusSessions.toCollection();

    if (filters?.taskId) {
      collection = collection.filter(session => session.taskId === filters.taskId);
    }
    if (filters?.goalId) {
      collection = collection.filter(session => session.goalId === filters.goalId);
    }
    if (filters?.completed !== undefined) {
      collection = collection.filter(session => session.completed === filters.completed);
    }
    if (filters?.startDate) {
      collection = collection.filter(session => session.startTime >= filters.startDate!);
    }
    if (filters?.endDate) {
      collection = collection.filter(session => session.startTime <= filters.endDate!);
    }

    return await collection.reverse().sortBy('startTime');
  },

  async getBreakStats(days: number = 7): Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    sessionsByDay: { date: string; sessions: number; minutes: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await this.getTimerBreakSessions({
      completed: true,
      startDate
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const averageSessionLength = sessions.length > 0 ? totalMinutes / sessions.length : 0;

    // Group by day
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = session.startTime.toISOString().split('T')[0];
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

    const sessions = await this.getTimerFocusSessions({
      completed: true,
      startDate
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const averageSessionLength = sessions.length > 0 ? totalMinutes / sessions.length : 0;


    // Group by day
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = session.startTime.toISOString().split('T')[0];
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