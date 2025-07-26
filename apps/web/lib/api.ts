import { ApiResponse, TimerSession, UserSettings, Task, Goal, Mentor, Message, Chat, FundingAccount, AuthResponse, User, Note } from '../types';
import { getJwtToken, isUserAuthenticated } from './auth';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    console.log('🔧 API Service - Backend URL:', this.baseUrl);
  }

  private getAuthToken(): string | null {
    // Use the centralized auth utility to get JWT token
    return getJwtToken();
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
    // console.log('🔐 API Request - Endpoint:', endpoint);
    // console.log('🔐 API Request - Token available:', !!token);
    // console.log('🔐 API Request - Token preview:', token ? `${token.substring(0, 20)}...` : 'None');

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // credentials: 'include', // Required for CORS with credentials
        // mode: 'cors', // Explicitly set CORS mode
      });

      // console.log('🔐 API Response - Status:', response.status);
      // console.log('🔐 API Response - URL:', url);
      // console.log('🔐 API Response - Headers:', Object.fromEntries(response.headers.entries()));

      if (response.status === 401) {
        // For 401 errors, we'll just throw an error since we don't have refresh token logic
        // in the current auth flow
        throw new Error('Authentication failed - please login again');
      }

      if (!response.ok) {
        console.error('🔐 API Response - Error status:', response.status);
        const errorText = await response.text();
        // console.error('🔐 API Response - Error body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
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

  async updateTaskCompleted(id: string, completed: boolean): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${id}/completed`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Goal methods
  async createGoal(goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Goal>> {
    return this.request<Goal>('/goals/create', {
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

  async getGoal(id: string): Promise<ApiResponse<Goal>> {
    return this.request<Goal>(`/goals/${id}`);
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<ApiResponse<Goal>> {
    return this.request<Goal>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteGoal(id: string): Promise<ApiResponse<Goal>> {
    return this.request<Goal>(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  async updateGoalProgress(id: string, progress: number): Promise<ApiResponse<Goal>> {
    return this.request<Goal>(`/goals/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
  }

  // Timer session methods
  async createTimerSession(sessionData: Omit<TimerSession, 'id' | 'userId' | 'createdAt'>): Promise<ApiResponse<TimerSession>> {
    return this.request<TimerSession>('/timer/timer-sessions', {
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

    return this.request<TimerSession[]>(`/timer/timer-sessions?${params.toString()}`);
  }

  async updateTimerSession(id: string, updates: Partial<TimerSession>): Promise<ApiResponse<TimerSession>> {
    return this.request<TimerSession>(`/timer/timer-sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTimerSession(id: string): Promise<ApiResponse> {
    return this.request(`/timer/timer-sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async createTimerBreakSession(sessionData: Omit<TimerSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<TimerSession>> {
    return this.request<TimerSession>('/timer-sessions', {
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
    return this.request(`/timer/stats/focus?days=${days}`);
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

  // Chat methods
  async getChats(filters?: {
    mentorId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Chat[]>> {
    const params = new URLSearchParams();
    if (filters?.mentorId) params.append('mentorId', filters.mentorId);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return this.request<Chat[]>(`/chat/chats?${params.toString()}`);
  }

  async getChat(chatId: string): Promise<ApiResponse<Chat>> {
    return this.request<Chat>(`/chat/chats/${chatId}`);
  }

  async createChat(chatData: {
    mentorId?: string;
    title?: string;
    metadata?: any;
  }): Promise<ApiResponse<Chat>> {
    return this.request<Chat>('/chat/chats', {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  }

  async updateChat(chatId: string, updates: {
    title?: string;
    isActive?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<Chat>> {
    return this.request<Chat>(`/chat/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteChat(chatId: string): Promise<ApiResponse<Chat>> {
    return this.request<Chat>(`/chat/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  async getChatMessages(chatId: string, filters?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return this.request<Message[]>(`/chat/chats/${chatId}/messages?${params.toString()}`);
  }

  // Legacy message methods (for backward compatibility)
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
  }): Promise<ApiResponse<{
    response: string;
    chatId: string;
    messageId: string;
    memory: any;
    usage: any;
  }>> {
    return this.request<{
      response: string;
      chatId: string;
      messageId: string;
      memory: any;
      usage: any;
    }>('/mentor/chat', {
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
    return isUserAuthenticated();
  }

  getAccessToken(): string | null {
    return getJwtToken();
  }

  async getBadges(userId: string) {
    return this.request(`/badges/user/${userId}`);
  }

  async awardBadge(userId: string, badge: { type: string; name: string; description: string; icon: string; dateAwarded: string; }) {
    return this.request(`/badges/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify(badge),
    });
  }

  async getQuests(userId: string) {
    return this.request(`/quests/user/${userId}`);
  }
  async getQuest(id: string) {
    return this.request(`/quests/${id}`);
  }

  async getGoalRecommendations(goalId: string) {
    return this.request(`/goals/${goalId}/recommendations/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        taskIds: [],
      }),
    });
  }

  async getNotes(filters?: {
    type?: string;
    source?: string;
    topic?: string;
  }): Promise<ApiResponse<Note[]>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.topic) params.append('topic', filters.topic);

    return this.request<Note[]>(`/notes?${params.toString()}`);
  }

  async createNote(noteData: Note): Promise<ApiResponse<Note>> {
    return this.request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async updateNote(id: string, noteData: Note): Promise<ApiResponse<Note>> {
    return this.request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
  }

  async deleteNote(id: string): Promise<ApiResponse> {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  async getNoteSources(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/notes/sources');
  }
}

export const api = new ApiService();
export const apiService = api;

export default api;