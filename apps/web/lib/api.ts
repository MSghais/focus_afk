import { ApiResponse, TimerSession, UserSettings, Task, Goal, Mentor, Message, Chat, FundingAccount, AuthResponse, User, Note, NoteRelation, NoteSource } from '../types';
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
      ...(options.headers as Record<string, string> || {}),
    };

    // Only set Content-Type to application/json if there's a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

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

  async getNote(id: string): Promise<ApiResponse<Note>> {
    return this.request<Note>(`/notes/${id}`);
  }

  async updateNote(id: string, noteData: Partial<Note>): Promise<ApiResponse<Note>> {
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

  async getNoteSources(): Promise<ApiResponse<{
    sources: NoteSource[];
    sourcesByType: Record<string, NoteSource[]>;
    totalSources: number;
  }>> {
    return this.request<{
      sources: NoteSource[];
      sourcesByType: Record<string, NoteSource[]>;
      totalSources: number;
    }>('/notes/sources');
  }

  async getNoteSourcesByType(type: string): Promise<ApiResponse<{
    sources: NoteSource[];
    type: string;
    count: number;
  }>> {
    return this.request<{
      sources: NoteSource[];
      type: string;
      count: number;
    }>(`/notes/sources/${type}`);
  }

    async getNoteRelations(id: string): Promise<ApiResponse<NoteRelation[]>> {
    return this.request<NoteRelation[]>(`/notes/${id}/relations`);
  }

  // Source Agent methods
  async scrapeWebsite(data: {
    url: string;
    noteId?: string;
    maxCharacters?: number;
    highlightQuery?: string;
    numSentences?: number;
  }): Promise<ApiResponse<{
    source: NoteSource;
    scrapedContent: any;
  }>> {
    return this.request(`/notes/source-agent/scrape-website`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeSource(data: {
    sourceId: string;
    analysisType: 'summary' | 'key_points' | 'questions' | 'insights';
  }): Promise<ApiResponse<{
    sourceId: string;
    analysisType: string;
    analysis: string;
    source: NoteSource;
  }>> {
    return this.request(`/notes/source-agent/analyze-source`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSourceInsights(sourceId: string): Promise<ApiResponse<{
    sourceId: string;
    insights: string;
    source: NoteSource;
  }>> {
    return this.request(`/notes/source-agent/source-insights/${sourceId}`);
  }

  async getSimilarSources(sourceId: string): Promise<ApiResponse<{
    sourceId: string;
    similarSources: any[];
    originalSource: NoteSource;
  }>> {
    return this.request(`/notes/source-agent/similar-sources/${sourceId}`);
  }

  async suggestSources(data: {
    text: string;
    maxResults?: number;
    includeContent?: boolean;
    searchType?: 'articles' | 'research' | 'tutorials' | 'documentation' | 'all';
  }): Promise<ApiResponse<{
    suggestions: NoteSource[];
    query: string;
    topics: string[];
    totalFound: number;
    searchType: string;
  }>> {
    return this.request(`/notes/source-agent/suggest-sources`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Note chat methods
  async getNoteChat(noteId: string, filters?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    messages: Message[];
    chat: Chat | null;
    note: {
      id: string;
      title: string;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());
    
    const endpoint = `/notes/${noteId}/chat${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{
      messages: Message[];
      chat: Chat | null;
      note: {
        id: string;
        title: string;
      };
    }>(endpoint);
  }

  async chatAboutNote(data: {
    noteId: string;
    prompt: string;
    mentorId?: string;
  }): Promise<ApiResponse<{
    response: string;
    chatId: string;
    messageId: string;
    note: {
      id: string;
      title: string;
      type: string;
      sourcesCount: number;
    };
    memory: any;
    usage: any;
  }>> {
    return this.request<{
      response: string;
      chatId: string;
      messageId: string;
      note: {
        id: string;
        title: string;
        type: string;
        sourcesCount: number;
      };
      memory: any;
      usage: any;
    }>('/notes/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Enhanced Chat API methods
  async getEnhancedChatUseCases(): Promise<ApiResponse<{
    useCases: Array<{
      value: string;
      label: string;
      description: string;
    }>;
  }>> {
    return this.request('/enhanced-chat/use-cases');
  }

  async enhancedChatGeneral(data: {
    prompt: string;
    mentorId?: string;
    sessionId?: string;
    model?: string;
    extraData?: any;
  }): Promise<ApiResponse<{
    text: string;
    metadata: any;
    context: any;
  }>> {
    return this.request('/enhanced-chat/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enhancedChatUseCase(data: {
    prompt: string;
    useCase: string;
    mentorId?: string;
    sessionId?: string;
    model?: string;
    customSystemPrompt?: string;
    extraData?: any;
    enableVectorSearch?: boolean;
    contextSources?: string[];
    maxVectorResults?: number;
    saveToChat?: boolean;
    chatId?: string;
  }): Promise<ApiResponse<{
    text: string;
    metadata: any;
    context: any;
  }>> {
    return this.request('/enhanced-chat/chat/use-case', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enhancedChatTaskPlanning(data: {
    prompt: string;
    mentorId?: string;
    sessionId?: string;
  }): Promise<ApiResponse<{
    text: string;
    metadata: any;
    context: any;
  }>> {
    return this.request('/enhanced-chat/assist/task-planning', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enhancedChatDeepAnalysis(data: {
    prompt: string;
    mentorId?: string;
    sessionId?: string;
  }): Promise<ApiResponse<{
    text: string;
    metadata: any;
    context: any;
  }>> {
    return this.request('/enhanced-chat/deep-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enhancedChatSearch(data: {
    query: string;
    types?: string[];
    limit?: number;
  }): Promise<ApiResponse<{
    results: any[];
  }>> {
    return this.request('/enhanced-chat/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEnhancedChatContextStats(): Promise<ApiResponse<{
    totalContexts: number;
    vectorSearchEnabled: boolean;
    averageResponseTime: number;
    contextSources: Record<string, number>;
  }>> {
    return this.request('/enhanced-chat/context/stats');
  }

  // Enhanced Chat Message Management
  async getEnhancedChatMessages(filters?: {
    limit?: number;
    offset?: number;
    chatId?: string;
    mentorId?: string;
    useCase?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    messages: Message[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.chatId) params.append('chatId', filters.chatId);
    if (filters?.mentorId) params.append('mentorId', filters.mentorId);
    if (filters?.useCase) params.append('useCase', filters.useCase);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    return this.request(`/enhanced-chat/messages?${params.toString()}`);
  }

  async getEnhancedChatMessagesByChat(chatId: string, filters?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    chat: Chat;
    messages: Message[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    return this.request(`/enhanced-chat/messages/chat/${chatId}?${params.toString()}`);
  }

  async getEnhancedChatMessageStats(): Promise<ApiResponse<{
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    totalChats: number;
    useCaseStats: Record<string, number>;
    recentActivity: number;
    averageMessagesPerChat: number;
  }>> {
    return this.request('/enhanced-chat/messages/stats');
  }

  async deleteEnhancedChatMessage(messageId: string): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.request(`/enhanced-chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async deleteEnhancedChatMessages(filters?: {
    chatId?: string;
    mentorId?: string;
    useCase?: string;
    beforeDate?: string;
  }): Promise<ApiResponse<{
    message: string;
    deletedCount: number;
  }>> {
    return this.request('/enhanced-chat/messages', {
      method: 'DELETE',
      body: JSON.stringify(filters || {}),
    });
  }

  async updateEnhancedChatEmbeddings(dataTypes?: string[]): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.request('/enhanced-chat/context/update-embeddings', {
      method: 'POST',
      body: JSON.stringify({ dataTypes }),
    });
  }

  // Enhanced Chat Specialized Endpoints
  async enhancedChatGoalTracking(data: {
    prompt: string;
    mentorId?: string;
    sessionId?: string;
  }): Promise<ApiResponse<{
    text: string;
    metadata: any;
    context: any;
  }>> {
    return this.request('/enhanced-chat/assist/goal-tracking', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enhancedChatFocusSessions(data: {
    prompt: string;
    sessionData?: any;
  }): Promise<ApiResponse<{
    text: string;
    metadata: any;
    context: any;
  }>> {
    return this.request('/enhanced-chat/assist/focus-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enhancedChatNoteAnalysis(data: {
    prompt: string;
    noteContext?: any;
  }): Promise<ApiResponse<{
    text: string;
    metadata: any;
    context: any;
  }>> {
    return this.request('/enhanced-chat/assist/note-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enhancedChatQuickQuestion(data: {
    prompt: string;
  }): Promise<ApiResponse<{
    text: string;
    metadata: any;
  }>> {
    return this.request<{
      text: string;
      metadata: any;
    }>('/enhanced-chat/quick-question', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Enhanced Quest System Methods
  async getEnhancedQuestStats(): Promise<ApiResponse<any>> {
    return this.request<any>(`/enhanced-quests/stats/`);
  }

  async getEnhancedUserQuests(): Promise<ApiResponse<{
    activeQuests: any[];
    completedQuests: any[];
  }>> {
    return this.request<{
      activeQuests: any[];
      completedQuests: any[];
    }>(`/enhanced-quests/user/`);
  }

  async generateEnhancedQuests(userId: string, userAddress: string): Promise<ApiResponse<{
    generatedQuests: any[];
    message: string;
  }>> {
    return this.request<{
      generatedQuests: any[];
      message: string;
    }>(`/enhanced-quests/generate/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ userAddress }),
    });
  }

  async completeEnhancedQuest(questId: string, userId: string, userAddress: string): Promise<ApiResponse<{
    message: string;
    questId: string;
    rewards: {
      xp: number;
      tokens: number;
    };
  }>> {
    return this.request<{
      message: string;
      questId: string;
      rewards: {
        xp: number;
        tokens: number;
      };
    }>(`/enhanced-quests/complete/${questId}`, {
      method: 'POST',
      body: JSON.stringify({ userId, userAddress }),
    });
  }

  async updateEnhancedQuestProgress(userId: string): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.request<{
      message: string;
    }>(`/enhanced-quests/update-progress/${userId}`, {
      method: 'POST',
    });
  }

  async getEnhancedQuestTemplates(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/enhanced-quests/templates');
  }

  async getEnhancedQuestLeaderboard(limit?: number): Promise<ApiResponse<any[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/enhanced-quests/leaderboard${params}`);
  }

  async getEnhancedQuestLevelProgress(userId: string): Promise<ApiResponse<{
    currentLevel: number;
    currentXp: number;
    nextLevelXp: number;
    progress: number;
  }>> {
    return this.request<{
      currentLevel: number;
      currentXp: number;
      nextLevelXp: number;
      progress: number;
    }>(`/enhanced-quests/level-progress/${userId}`);
  }

  async processEnhancedGamificationEvent(event: any): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.request<{
      message: string;
    }>('/enhanced-quests/event', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async getEnhancedQuestAnalytics(userId: string): Promise<ApiResponse<{
    questStats: any[];
    questTimeline: any[];
    completionRate: number;
    totalQuests: number;
    completedQuests: number;
  }>> {
    return this.request<{
      questStats: any[];
      questTimeline: any[];
      completionRate: number;
      totalQuests: number;
      completedQuests: number;
    }>(`/enhanced-quests/analytics/${userId}`);
  }

  // Generic Quest Creation
  async createGenericQuest(questData: {
    userId: string;
    userAddress: string;
    name: string;
    description: string;
    category: 'focus' | 'tasks' | 'goals' | 'notes' | 'learning' | 'social' | 'custom';
    difficulty: 1 | 2 | 3 | 4 | 5;
    rewardXp: number;
    rewardTokens: number;
    completionCriteria: {
      type: 'count' | 'duration' | 'streak' | 'custom';
      target: number;
      unit?: string;
    };
    expiresAt?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
  }): Promise<ApiResponse<{
    quest: any;
    message: string;
  }>> {
    return this.request<{
      quest: any;
      message: string;
    }>('/enhanced-quests/create-generic', {
      method: 'POST',
      body: JSON.stringify(questData),
    });
  }

  // Suggestion Quest Creation
  async createSuggestionQuest(questData: {
    userId: string;
    userAddress: string;
    suggestionType: 'productivity' | 'wellness' | 'learning' | 'social' | 'custom';
    context: any[];
    aiReasoning: string;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    expiresAt?: string;
  }): Promise<ApiResponse<{
    quest: any;
    message: string;
  }>> {
    return this.request<{
      quest: any;
      message: string;
    }>('/enhanced-quests/create-suggestion', {
      method: 'POST',
      body: JSON.stringify(questData),
    });
  }

  // Connection Quests
  async sendConnectionQuests(userId: string, userAddress: string): Promise<ApiResponse<{
    quests: any[];
    message: string;
  }>> {
    return this.request<{
      quests: any[];
      message: string;
    }>(`/enhanced-quests/connection-quests/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ userAddress }),
    });
  }

  // Contextual Quests
  async sendContextualQuests(
    userId: string,
    userAddress: string,
    triggerPoint: 'task_completion' | 'goal_progress' | 'focus_session' | 'note_creation' | 'streak_milestone' | 'level_up' | 'idle_detection'
  ): Promise<ApiResponse<{
    quests: any[];
    message: string;
  }>> {
    return this.request<{
      quests: any[];
      message: string;
    }>(`/enhanced-quests/contextual-quests/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ userAddress, triggerPoint }),
    });
  }

  // Quest Suggestions
  async getQuestSuggestions(userId: string, limit?: number): Promise<ApiResponse<{
    suggestions: any[];
    message: string;
  }>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<{
      suggestions: any[];
      message: string;
    }>(`/enhanced-quests/suggestions/${userId}${params}`);
  }

  // Quest Templates
  async getQuestTemplates(type: string, filters?: {
    category?: string;
    difficulty?: number;
  }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty.toString());
    
    const queryString = params.toString();
    const url = `/enhanced-quests/templates/${type}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any[]>(url);
  }

  // Bulk Quest Creation
  async bulkCreateQuests(data: {
    userId: string;
    userAddress: string;
    quests: Array<{
      type: 'generic' | 'suggestion';
      data: any;
    }>;
  }): Promise<ApiResponse<{
    quests: any[];
    message: string;
  }>> {
    return this.request<{
      quests: any[];
      message: string;
    }>('/enhanced-quests/bulk-create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Priority Quest Suggestions
  async generatePriorityQuestSuggestions(userAddress: string): Promise<ApiResponse<{
    quests: any[];
    message: string;
    hasTaskData: boolean;
    questTypes: string[];
  }>> {
    return this.request<{
      quests: any[];
      message: string;
      hasTaskData: boolean;
      questTypes: string[];
    }>(`/enhanced-quests/priority-suggestions/`, {
      method: 'POST',
      body: JSON.stringify({ userAddress }),
    });
  }

  // Task Summary
  async getTaskSummary(): Promise<ApiResponse<{
    totalTasks: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    overdue: number;
    recentTasks: any[];
  }>> {
    return this.request<{
      totalTasks: number;
      highPriority: number;
      mediumPriority: number;
      lowPriority: number;
      overdue: number;
      recentTasks: any[];
    }>(`/enhanced-quests/task-summary/`);
  }

  // Test Quest Personalization
  async testQuestPersonalization(userAddress: string): Promise<ApiResponse<{
    userContext: any;
    vectorContext: any;
    personalizedQuests: any;
    message: string;
  }>> {
    return this.request<{
      userContext: any;
      vectorContext: any;
      personalizedQuests: any;
      message: string;
    }>(`/enhanced-quests/test-personalization?userAddress=${userAddress}`);
  }

  // Audio methods
  async generateNoteAudioSummary(noteId: string): Promise<Blob> {
    const url = `${this.baseUrl}/audio/${noteId}/note/summary`;
    const headers: Record<string, string> = {};
    
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Check if response is audio content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('audio/')) {
      // Convert the response to a blob
      const arrayBuffer = await response.arrayBuffer();
      return new Blob([arrayBuffer], { type: 'audio/mpeg' });
    } else {
      // Handle JSON error response
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate audio');
    }
  }

  async generateTextAudioSummary(text: string): Promise<Blob> {
    const url = `${this.baseUrl}/audio/summary`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Check if response is audio content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('audio/')) {
      // Convert the response to a blob
      const arrayBuffer = await response.arrayBuffer();
      return new Blob([arrayBuffer], { type: 'audio/mpeg' });
    } else {
      // Handle JSON error response
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate audio');
    }
  }

  // Google Calendar Methods
  async getGoogleCalendarAuthUrl(): Promise<ApiResponse<{ authUrl: string }>> {
    return this.request<{ authUrl: string }>('/calendar/google/auth-url');
  }

  async handleGoogleCalendarCallback(code: string): Promise<ApiResponse> {
    return this.request('/calendar/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getCalendars(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/calendar/calendars');
  }

  async createCalendarEvent(eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: { email: string }[];
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getCalendarEvents(options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (options?.timeMin) params.append('timeMin', options.timeMin);
    if (options?.timeMax) params.append('timeMax', options.timeMax);
    if (options?.maxResults) params.append('maxResults', options.maxResults.toString());

    return this.request<any[]>(`/calendar/events?${params.toString()}`);
  }

  async getFreeBusy(timeMin: string, timeMax: string): Promise<ApiResponse<any>> {
    return this.request<any>('/calendar/freebusy', {
      method: 'POST',
      body: JSON.stringify({ timeMin, timeMax }),
    });
  }
}

export const api = new ApiService();
export const apiService = api;

export default api;