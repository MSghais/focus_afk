import { PrismaClient } from '@prisma/client';

export interface MemoryContext {
  userId: string;
  mentorId?: string;
  sessionId: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }>;
  userContext: {
    tasks: any[];
    goals: any[];
    timerSessions: any[];
    userProfile?: any;
    mentorProfile?: any;
    badges?: any[];
    quests?: any[];
    settings?: any;
  };
  metadata: {
    lastUpdated: Date;
    contextVersion: number;
    memorySize: number;
    sessionStartTime: Date;
    dataSources: string[];
  };
}

export interface MemoryConfig {
  maxMessages: number;
  maxContextSize: number; // in bytes
  retentionPeriod: number; // in hours
  enableCompression: boolean;
  contextSources: ('tasks' | 'goals' | 'sessions' | 'profile' | 'mentor' | 'badges' | 'quests' | 'settings')[];
  maxItemsPerSource: number;
}

export interface DataSource {
  name: string;
  load: (userId: string, mentorId?: string) => Promise<any[]>;
  priority: number; // Higher priority sources are loaded first
  maxItems: number;
}

export class MemoryManager {
  private prisma: PrismaClient;
  private config: MemoryConfig;
  private memoryCache: Map<string, MemoryContext> = new Map();
  private dataSources: Map<string, DataSource> = new Map();

  constructor(prisma: PrismaClient, config: Partial<MemoryConfig> = {}) {
    this.prisma = prisma;
    this.config = {
      maxMessages: 50,
      maxContextSize: 1024 * 1024, // 1MB
      retentionPeriod: 24, // 24 hours
      enableCompression: true,
      contextSources: ['tasks', 'goals', 'sessions', 'profile', 'mentor', 'badges', 'quests', 'settings'],
      maxItemsPerSource: 10,
      ...config
    };

    this.initializeDataSources();
  }

  private initializeDataSources() {
    // Register data sources with their loading functions
    this.registerDataSource('tasks', {
      name: 'tasks',
      priority: 1,
      maxItems: 10,
      load: async (userId: string) => {
        return await this.prisma.task.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: this.config.maxItemsPerSource
        });
      }
    });

    this.registerDataSource('goals', {
      name: 'goals',
      priority: 2,
      maxItems: 5,
      load: async (userId: string) => {
        return await this.prisma.goal.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: this.config.maxItemsPerSource
        });
      }
    });

    this.registerDataSource('sessions', {
      name: 'sessions',
      priority: 3,
      maxItems: 10,
      load: async (userId: string) => {
        return await this.prisma.timerSession.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: this.config.maxItemsPerSource
        });
      }
    });

    this.registerDataSource('profile', {
      name: 'profile',
      priority: 4,
      maxItems: 1,
      load: async (userId: string) => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            loginType: true,
            createdAt: true,
            verified: true
          }
        });
        return user ? [user] : [];
      }
    });

    this.registerDataSource('mentor', {
      name: 'mentor',
      priority: 5,
      maxItems: 1,
      load: async (userId: string, mentorId?: string) => {
        if (!mentorId) return [];
        const mentor = await this.prisma.mentor.findUnique({
          where: { id: mentorId }
        });
        return mentor ? [mentor] : [];
      }
    });

    this.registerDataSource('badges', {
      name: 'badges',
      priority: 6,
      maxItems: 5,
      load: async (userId: string) => {
        return await this.prisma.badge.findMany({
          where: { userId },
          // orderBy: { createdAt: 'desc' },
          take: this.config.maxItemsPerSource
        });
      }
    });

    this.registerDataSource('quests', {
      name: 'quests',
      priority: 7,
      maxItems: 5,
      load: async (userId: string) => {
        return await this.prisma.quests.findMany({
          where: { userId },
          // orderBy: { createdAt: 'desc' },
          take: this.config.maxItemsPerSource
        });
      }
    });

    this.registerDataSource('settings', {
      name: 'settings',
      priority: 8,
      maxItems: 1,
      load: async (userId: string) => {
        const settings = await this.prisma.userSettings.findUnique({
          where: { userId }
        });
        return settings ? [settings] : [];
      }
    });
  }

  // Register a new data source
  registerDataSource(name: string, dataSource: DataSource) {
    this.dataSources.set(name, dataSource);
  }

  // Create or get memory context for a session
  async getOrCreateMemory(
    userId: string,
    mentorId?: string,
    sessionId?: string
  ): Promise<MemoryContext> {
    const sessionKey = sessionId || `${userId}_${mentorId || 'default'}`;
    
    // Check cache first
    const cached = this.memoryCache.get(sessionKey);
    if (cached && this.isMemoryValid(cached)) {
      return cached;
    }

    // Load from database or create new
    const memory = await this.loadMemoryFromDatabase(userId, mentorId, sessionKey);
    this.memoryCache.set(sessionKey, memory);
    
    return memory;
  }

  // Update memory with new context
  async updateMemory(
    sessionKey: string,
    updates: {
      messages?: any[];
      userContext?: Partial<MemoryContext['userContext']>;
      dataSources?: string[];
    }
  ): Promise<MemoryContext> {
    const existing = this.memoryCache.get(sessionKey);
    if (!existing) {
      throw new Error(`Memory session ${sessionKey} not found`);
    }

    const updatedMemory: MemoryContext = {
      ...existing,
      messages: updates.messages ? this.processMessages(updates.messages) : existing.messages,
      userContext: {
        ...existing.userContext,
        ...updates.userContext
      },
      metadata: {
        ...existing.metadata,
        lastUpdated: new Date(),
        contextVersion: existing.metadata.contextVersion + 1,
        memorySize: 0,
        dataSources: updates.dataSources || existing.metadata.dataSources
      }
    };

    // Calculate memory size
    updatedMemory.metadata.memorySize = this.calculateMemorySize(updatedMemory);

    // Apply memory limits
    const processedMemory = this.applyMemoryLimits(updatedMemory);
    
    // Update cache
    this.memoryCache.set(sessionKey, processedMemory);
    
    // Persist to database
    await this.persistMemoryToDatabase(processedMemory);
    
    return processedMemory;
  }

  // Load all user context data from multiple sources
  async loadUserContext(
    userId: string, 
    mentorId?: string,
    requestedSources?: string[]
  ): Promise<MemoryContext['userContext']> {
    const context: MemoryContext['userContext'] = {
      tasks: [],
      goals: [],
      timerSessions: [],
      userProfile: null,
      mentorProfile: null,
      badges: [],
      quests: [],
      settings: null
    };

    const sourcesToLoad = requestedSources || this.config.contextSources;
    
    // Sort sources by priority
    const sortedSources = Array.from(this.dataSources.entries())
      .filter(([name]) => sourcesToLoad.includes(name as any))
      .sort(([, a], [, b]) => b.priority - a.priority);

    try {
      // Load data from each source
      for (const [sourceName, dataSource] of sortedSources) {
        try {
          const data = await dataSource.load(userId, mentorId);
          
          switch (sourceName) {
            case 'tasks':
              context.tasks = data;
              break;
            case 'goals':
              context.goals = data;
              break;
            case 'sessions':
              context.timerSessions = data;
              break;
            case 'profile':
              context.userProfile = data[0] || null;
              break;
            case 'mentor':
              context.mentorProfile = data[0] || null;
              break;
            case 'badges':
              context.badges = data;
              break;
            case 'quests':
              context.quests = data;
              break;
            case 'settings':
              context.settings = data[0] || null;
              break;
          }
        } catch (error) {
          console.error(`Error loading data source ${sourceName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    }

    return context;
  }

  // Generate enhanced prompt with memory context
  async generateEnhancedPrompt(
    userId: string,
    mentorId: string | undefined,
    userMessage: string,
    sessionId?: string,
    includeHistory: boolean = true,
    requestedSources?: string[]
  ): Promise<string> {
    const sessionKey = sessionId || `${userId}_${mentorId || 'default'}`;
    const memory = await this.getOrCreateMemory(userId, mentorId, sessionId);
    
    if (!memory) {
      return userMessage;
    }

    let enhancedPrompt = `Context: You are an AI mentor helping with productivity and focus.`;

    // Add user context information from multiple sources
    if (requestedSources?.includes('tasks') || this.config.contextSources.includes('tasks')) {
      if (memory.userContext.tasks.length > 0) {
        enhancedPrompt += `\n\nCurrent Tasks:\n${memory.userContext.tasks.map((t: any) => 
          `- ${t.title}${t.description ? `: ${t.description}` : ''} (${t.priority} priority, ${t.completed ? 'completed' : 'pending'})`
        ).join('\n')}`;
      }
    }

    if (requestedSources?.includes('goals') || this.config.contextSources.includes('goals')) {
      if (memory.userContext.goals.length > 0) {
        enhancedPrompt += `\n\nCurrent Goals:\n${memory.userContext.goals.map((g: any) => 
          `- ${g.title}${g.description ? `: ${g.description}` : ''} (${g.progress}% complete)`
        ).join('\n')}`;
      }
    }

    if (requestedSources?.includes('sessions') || this.config.contextSources.includes('sessions')) {
      if (memory.userContext.timerSessions.length > 0) {
        const recentSessions = memory.userContext.timerSessions.slice(0, 3);
        enhancedPrompt += `\n\nRecent Focus Sessions:\n${recentSessions.map((s: any) => 
          `- ${s.type} session: ${Math.round(s.duration / 60)} minutes on ${new Date(s.startTime).toLocaleDateString()}`
        ).join('\n')}`;
      }
    }

    if (requestedSources?.includes('mentor') || this.config.contextSources.includes('mentor')) {
      if (memory.userContext.mentorProfile) {
        const mentor = memory.userContext.mentorProfile;
        enhancedPrompt += `\n\nMentor Context:\n- Name: ${mentor.name}\n- Role: ${mentor.role}\n- Knowledge: ${mentor.knowledges?.join(', ')}`;
      }
    }

    if (requestedSources?.includes('badges') || this.config.contextSources.includes('badges')) {
      if (memory.userContext.badges && memory.userContext.badges.length > 0) {
        enhancedPrompt += `\n\nRecent Badges:\n${memory.userContext.badges.map((b: any) => 
          `- ${b.name}: ${b.description}`
        ).join('\n')}`;
      }
    }

    if (requestedSources?.includes('quests') || this.config.contextSources.includes('quests')) {
      if (memory.userContext.quests && memory.userContext.quests.length > 0) {
        enhancedPrompt += `\n\nActive Quests:\n${memory.userContext.quests.map((q: any) => 
          `- ${q.name}: ${q.description}`
        ).join('\n')}`;
      }
    }

    // Add conversation history if requested
    if (includeHistory && memory.messages.length > 0) {
      const historyMessages = memory.messages.slice(-10); // Last 10 messages
      const conversationHistory = historyMessages.map(m => 
        `${m.role}: ${m.content}`
      ).join('\n');
      
      enhancedPrompt += `\n\nRecent Conversation History:\n${conversationHistory}`;
    }

    enhancedPrompt += `\n\nCurrent User Message: ${userMessage}`;
    enhancedPrompt += `\n\nPlease respond as the AI mentor, taking into account the user's current tasks, goals, recent sessions, and conversation history. Provide personalized, actionable advice.`;

    return enhancedPrompt;
  }

  // Refresh memory context from all sources
  async refreshMemoryContext(
    userId: string,
    mentorId: string | undefined,
    sessionId: string | undefined,
    requestedSources?: string[]
  ): Promise<MemoryContext> {
    const sessionKey = sessionId || `${userId}_${mentorId || 'default'}`;
    const memory = await this.getOrCreateMemory(userId, mentorId, sessionId);
    
    // Load fresh context data
    const freshContext = await this.loadUserContext(userId, mentorId, requestedSources);
    
    // Update memory with fresh context
    const updatedMemory = await this.updateMemory(sessionKey, {
      userContext: freshContext,
      dataSources: requestedSources || this.config.contextSources
    });
    
    return updatedMemory;
  }

  // Clear memory for a session
  async clearMemory(sessionKey: string): Promise<boolean> {
    const deleted = this.memoryCache.delete(sessionKey);
    
    // Also clear from database
    try {
      // You might want to add a memory table to the database schema
      // For now, we'll just clear the cache
      console.log(`Cleared memory for session: ${sessionKey}`);
    } catch (error) {
      console.error('Error clearing memory from database:', error);
    }
    
    return deleted;
  }

  // Get memory statistics
  getMemoryStats(): {
    totalSessions: number;
    totalSize: number;
    oldestSession: Date | null;
    newestSession: Date | null;
    dataSources: string[];
  } {
    const sessions = Array.from(this.memoryCache.values());
    const totalSize = sessions.reduce((sum, session) => 
      sum + session.metadata.memorySize, 0
    );
    
    const dates = sessions.map(s => s.metadata.lastUpdated);
    const allDataSources = new Set<string>();
    sessions.forEach(s => s.metadata.dataSources.forEach(ds => allDataSources.add(ds)));
    
    return {
      totalSessions: sessions.length,
      totalSize,
      oldestSession: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
      newestSession: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
      dataSources: Array.from(allDataSources)
    };
  }

  // Clean up expired memories
  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionKey, memory] of this.memoryCache.entries()) {
      const hoursSinceLastActivity = (now - memory.metadata.lastUpdated.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastActivity > this.config.retentionPeriod) {
        this.memoryCache.delete(sessionKey);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Get available data sources
  getAvailableDataSources(): string[] {
    return Array.from(this.dataSources.keys());
  }

  private isMemoryValid(memory: MemoryContext): boolean {
    const hoursSinceLastActivity = (Date.now() - memory.metadata.lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastActivity <= this.config.retentionPeriod;
  }

  private async loadMemoryFromDatabase(
    userId: string, 
    mentorId: string | undefined, 
    sessionKey: string
  ): Promise<MemoryContext> {
    // Load recent messages from chats (new structure)
    const chats = await this.prisma.chat.findMany({
      where: { 
        userId,
        mentorId: mentorId || null
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: this.config.maxMessages
        }
      },
      take: 5 // Get last 5 chats
    });

    // Flatten messages from all chats
    const messages = chats.flatMap(chat => chat.messages).slice(0, this.config.maxMessages);

    // Load user context from all sources
    const userContext = await this.loadUserContext(userId, mentorId);

    return {
      userId,
      mentorId,
      sessionId: sessionKey,
      messages: messages.reverse().map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt
      })),
      userContext,
      metadata: {
        lastUpdated: new Date(),
        contextVersion: 1,
        memorySize: 0,
        sessionStartTime: new Date(),
        dataSources: this.config.contextSources
      }
    };
  }

  private processMessages(messages: any[]): MemoryContext['messages'] {
    return messages
      .slice(-this.config.maxMessages) // Keep only recent messages
      .map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt
      }));
  }

  private calculateMemorySize(memory: MemoryContext): number {
    return JSON.stringify(memory).length;
  }

  private applyMemoryLimits(memory: MemoryContext): MemoryContext {
    // Apply message limit
    if (memory.messages.length > this.config.maxMessages) {
      memory.messages = memory.messages.slice(-this.config.maxMessages);
    }

    // Apply size limit
    const currentSize = this.calculateMemorySize(memory);
    if (currentSize > this.config.maxContextSize) {
      // Remove oldest messages until size is under limit
      while (memory.messages.length > 1 && this.calculateMemorySize(memory) > this.config.maxContextSize) {
        memory.messages.shift();
      }
    }

    return memory;
  }

  private async persistMemoryToDatabase(memory: MemoryContext): Promise<void> {
    // For now, we'll just update the metadata in the messages
    // In a full implementation, you might want to create a separate memory table
    try {
      // Update the last message with memory metadata
      if (memory.messages.length > 0) {
        const lastMessage = memory.messages[memory.messages.length - 1];
        await this.prisma.message.update({
          where: { id: lastMessage.id },
          data: {
            metadata: {
              memoryContext: {
                sessionId: memory.sessionId,
                contextVersion: memory.metadata.contextVersion,
                lastUpdated: memory.metadata.lastUpdated,
                dataSources: memory.metadata.dataSources
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error persisting memory to database:', error);
    }
  }
} 