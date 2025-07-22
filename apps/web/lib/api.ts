// API service for backend communication
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  completed: boolean;
  progress: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
  relatedTaskIds: string[];
}

export interface TimerSession {
  id: string;
  userId: string;
  taskId?: string;
  goalId?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface TimerBreakSession {
  id: string;
  userId: string;
  taskId?: string;
  goalId?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  completed: boolean;
  isHavingFun?: boolean;
  activities?: string[];
  persons?: string[];
  location?: string;
  weather?: string;
  mood?: string;
  energyLevel?: string;
  productivityLevel?: string;
  notes?: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultFocusDuration: number;
  defaultBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  updatedAt: string;
}

export interface User {
  id: string;
  userAddress: string;
  email?: string;
  name?: string;
  loginType: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  starknetAddress?: string;
  evmAddress?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

class ApiService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.loadTokens();
  }

  private loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshResult = await this.refreshAccessToken();
        if (refreshResult.success) {
          // Retry the original request
          headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return await retryResponse.json();
        } else {
          this.clearTokens();
          throw new Error('Authentication failed');
        }
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async evmLogin(address: string, signature: string, message: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/evm-login', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message }),
    });

    if (response.success && response.data) {
      this.saveTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async starknetLogin(address: string, signature: string, message: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/starknet-login', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message }),
    });

    if (response.success && response.data) {
      this.saveTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async refreshAccessToken(): Promise<ApiResponse<{ accessToken: string }>> {
    if (!this.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    const response = await this.request<{ accessToken: string }>('/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (response.success && response.data) {
      this.accessToken = response.data.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'current' }), // You might want to track session IDs
    });

    this.clearTokens();
    return response;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/me');
  }

  // Task methods
  async createTask(taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Task>> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async getTasks(filters?: {
    completed?: boolean;
    priority?: string;
    category?: string;
  }): Promise<ApiResponse<Task[]>> {
    const params = new URLSearchParams();
    if (filters?.completed !== undefined) params.append('completed', filters.completed.toString());
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);

    return this.request<Task[]>(`/tasks?${params.toString()}`);
  }

  async getTask(id: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Goal methods
  async createGoal(goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Goal>> {
    return this.request<Goal>('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async getGoals(filters?: {
    completed?: boolean;
    category?: string;
  }): Promise<ApiResponse<Goal[]>> {
    const params = new URLSearchParams();
    if (filters?.completed !== undefined) params.append('completed', filters.completed.toString());
    if (filters?.category) params.append('category', filters.category);

    return this.request<Goal[]>(`/goals?${params.toString()}`);
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<ApiResponse<Goal>> {
    return this.request<Goal>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Timer session methods
  async createTimerSession(sessionData: Omit<TimerSession, 'id' | 'userId' | 'createdAt'>): Promise<ApiResponse<TimerSession>> {
    return this.request<TimerSession>('/timer-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getTimerSessions(filters?: {
    taskId?: string;
    goalId?: string;
    completed?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<TimerSession[]>> {
    const params = new URLSearchParams();
    if (filters?.taskId) params.append('taskId', filters.taskId);
    if (filters?.goalId) params.append('goalId', filters.goalId);
    if (filters?.completed !== undefined) params.append('completed', filters.completed.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    return this.request<TimerSession[]>(`/timer-sessions?${params.toString()}`);
  }

  async createTimerBreakSession(sessionData: Omit<TimerBreakSession, 'id' | 'userId' | 'createdAt'>): Promise<ApiResponse<TimerBreakSession>> {
    return this.request<TimerBreakSession>('/timer-break-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Settings methods
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    return this.request<UserSettings>('/settings');
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return this.request<UserSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Statistics methods
  async getTaskStats(): Promise<ApiResponse<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }>> {
    return this.request('/stats/tasks');
  }

  async getFocusStats(days: number = 7): Promise<ApiResponse<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
    sessionsByDay: { date: string; sessions: number; minutes: number }[];
  }>> {
    return this.request(`/stats/focus?days=${days}`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const apiService = new ApiService(); 