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

// Mentor and Message interfaces
export interface Mentor {
  id: string;
  userId: string;
  name: string;
  role: string;
  knowledges: string[];
  about?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  userId: string;
  mentorId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokens?: number;
  metadata?: any;
  createdAt: string;
  mentor?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface FundingAccount {
  id: string;
  userId: string;
  accountType: 'crypto' | 'fiat' | 'subscription';
  accountName: string;
  accountAddress?: string;
  accountDetails?: any;
  isActive: boolean;
  balance?: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  }

  private getAuthToken(): string | null {
    // Try to get token from Zustand store first
    if (typeof window !== 'undefined') {
      // Access the auth store directly
      const authStore = (window as any).__ZUSTAND_AUTH_STORE__;
      if (authStore?.getState()?.jwtToken) {
        return authStore.getState().jwtToken;
      }
      
      // Fallback to localStorage for backward compatibility
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // For 401 errors, we'll just throw an error since we don't have refresh token logic
        // in the current auth flow
        throw new Error('Authentication failed - please login again');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async evmLogin(address: string, signature: string, message: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/evm-login', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message }),
    });

    return response;
  }

  async starknetLogin(address: string, signature: string, message: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/starknet-login', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message }),
    });

    return response;
  }

  async refreshAccessToken(): Promise<ApiResponse<{ accessToken: string }>> {
    return { success: false, error: 'Refresh token not implemented in current auth flow' };
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'current' }),
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/me');
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

  // Mentor methods
  async createMentor(mentorData: {
    name: string;
    role?: string;
    knowledges: string[];
    about?: string;
  }): Promise<ApiResponse<Mentor>> {
    return this.request<Mentor>('/mentor/mentors', {
      method: 'POST',
      body: JSON.stringify(mentorData),
    });
  }

  async getMentors(): Promise<ApiResponse<Mentor[]>> {
    return this.request<Mentor[]>('/mentor/mentors');
  }

  async updateMentor(id: string, updates: Partial<Mentor>): Promise<ApiResponse<Mentor>> {
    return this.request<Mentor>(`/mentor/mentors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMentor(id: string): Promise<ApiResponse> {
    return this.request(`/mentor/mentors/${id}`, {
      method: 'DELETE',
    });
  }

  // Message methods
  async getMessages(filters?: {
    mentorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams();
    if (filters?.mentorId) params.append('mentorId', filters.mentorId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return this.request<Message[]>(`/mentor/messages?${params.toString()}`);
  }

  async sendChatMessage(messageData: {
    prompt: string;
    model?: string;
    mentorId?: string;
  }): Promise<ApiResponse<{ response: any }>> {
    return this.request<{ response: any }>('/mentor/chat', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Funding account methods
  async createFundingAccount(accountData: {
    accountType: 'crypto' | 'fiat' | 'subscription';
    accountName: string;
    accountAddress?: string;
    accountDetails?: any;
    balance?: number;
    currency?: string;
  }): Promise<ApiResponse<FundingAccount>> {
    return this.request<FundingAccount>('/mentor/funding-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async getFundingAccounts(): Promise<ApiResponse<FundingAccount[]>> {
    return this.request<FundingAccount[]>('/mentor/funding-accounts');
  }

  async updateFundingAccount(id: string, updates: Partial<FundingAccount>): Promise<ApiResponse<FundingAccount>> {
    return this.request<FundingAccount>(`/mentor/funding-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteFundingAccount(id: string): Promise<ApiResponse> {
    return this.request(`/mentor/funding-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getAccessToken(): string | null {
    return this.getAuthToken();
  }
}

export const apiService = new ApiService(); 