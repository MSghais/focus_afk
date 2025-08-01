import { PrismaClient } from '@prisma/client';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  type: 'task' | 'goal' | 'note' | 'session' | 'quest' | 'badge' | 'user_profile';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[];
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

export interface VectorStoreConfig {
  modelName?: string;
  batchSize?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  maxResults?: number;
  similarityThreshold?: number;
}

export class VectorStoreManager {
  private prisma: PrismaClient;
  private embeddings: OpenAIEmbeddings;
  private vectorStore: MemoryVectorStore;
  private config: VectorStoreConfig;

  constructor(prisma: PrismaClient, config?: VectorStoreConfig) {
    this.prisma = prisma;
    this.config = {
      modelName: 'text-embedding-ada-002',
      batchSize: 100,
      chunkSize: 1000,
      chunkOverlap: 200,
      maxResults: 10,
      similarityThreshold: 0.7,
      ...config
    };

    this.embeddings = new OpenAIEmbeddings({
      modelName: this.config.modelName,
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    this.vectorStore = new MemoryVectorStore(this.embeddings);
  }

  /**
   * Index documents for a user
   */
  async indexUserDocuments(userId: string, documentTypes?: string[]): Promise<void> {
    const types = documentTypes || ['task', 'goal', 'note', 'session', 'quest', 'badge'];
    
    for (const type of types) {
      await this.indexDocumentType(userId, type);
    }
  }

  /**
   * Index a specific document type for a user
   */
  private async indexDocumentType(userId: string, documentType: string): Promise<void> {
    console.log(`Indexing ${documentType} documents for user ${userId}`);

    let documents: VectorDocument[] = [];

    switch (documentType) {
      case 'task':
        documents = await this.getTaskDocuments(userId);
        break;
      case 'goal':
        documents = await this.getGoalDocuments(userId);
        break;
      case 'note':
        documents = await this.getNoteDocuments(userId);
        break;
      case 'session':
        documents = await this.getSessionDocuments(userId);
        break;
      case 'quest':
        documents = await this.getQuestDocuments(userId);
        break;
      case 'badge':
        documents = await this.getBadgeDocuments(userId);
        break;
      case 'user_profile':
        documents = await this.getUserProfileDocuments(userId);
        break;
    }

    if (documents.length > 0) {
      await this.indexDocuments(documents);
    }
  }

  /**
   * Get task documents for indexing
   */
  private async getTaskDocuments(userId: string): Promise<VectorDocument[]> {
    const tasks = await this.prisma.task.findMany({
      where: { 
        userId,
        isArchived: false
      },
      include: {
        timerSessions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return tasks.map(task => ({
      id: `task_${task.id}`,
      content: this.formatTaskContent(task),
      metadata: {
        type: 'task',
        userId,
        taskId: task.id,
        priority: task.priority,
        completed: task.completed,
        category: task.category,
        dueDate: task.dueDate,
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: task.actualMinutes,
        goalIds: task.goalIds,
        sessionCount: task.timerSessions.length
      },
      type: 'task' as const,
      userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));
  }

  /**
   * Get goal documents for indexing
   */
  private async getGoalDocuments(userId: string): Promise<VectorDocument[]> {
    const goals = await this.prisma.goal.findMany({
      where: { 
        userId,
        isArchived: false
      }
    });

    return goals.map(goal => ({
      id: `goal_${goal.id}`,
      content: this.formatGoalContent(goal),
      metadata: {
        type: 'goal',
        userId,
        goalId: goal.id,
        progress: goal.progress,
        completed: goal.completed,
        category: goal.category,
        targetDate: goal.targetDate,
        taskIds: goal.taskIds,
        topics: goal.topics
      },
      type: 'goal' as const,
      userId,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    }));
  }

  /**
   * Get note documents for indexing
   */
  private async getNoteDocuments(userId: string): Promise<VectorDocument[]> {
    const notes = await this.prisma.notes.findMany({
      where: { userId },
      include: {
        noteSources: true
      }
    });

    return notes.map(note => ({
      id: `note_${note.id}`,
      content: this.formatNoteContent(note),
      metadata: {
        type: 'note',
        userId,
        noteId: note.id,
        title: note.title,
        topics: note.topics,
        aiTopics: note.aiTopics,
        difficulty: note.difficulty,
        isNotebook: note.isNotebook,
        sourceCount: note.noteSources.length
      },
      type: 'note' as const,
      userId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }));
  }

  /**
   * Get session documents for indexing
   */
  private async getSessionDocuments(userId: string): Promise<VectorDocument[]> {
    const sessions = await this.prisma.timerSession.findMany({
      where: { userId },
      include: {
        task: true,
        goal: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent sessions
    });

    return sessions.map(session => ({
      id: `session_${session.id}`,
      content: this.formatSessionContent(session),
      metadata: {
        type: 'session',
        userId,
        sessionId: session.id,
        sessionType: session.type,
        duration: session.duration,
        completed: session.completed,
        taskId: session.taskId,
        goalId: session.goalId,
        mood: session.mood,
        energyLevel: session.energyLevel,
        productivityLevel: session.productivityLevel,
        isHavingFun: session.isHavingFun,
        activities: session.activities,
        persons: session.persons,
        location: session.location,
        weather: session.weather
      },
      type: 'session' as const,
      userId,
      createdAt: session.createdAt,
      updatedAt: session.createdAt
    }));
  }

  /**
   * Get quest documents for indexing
   */
  private async getQuestDocuments(userId: string): Promise<VectorDocument[]> {
    const quests = await this.prisma.quests.findMany({
      where: { userId }
    });

    return quests.map(quest => ({
      id: `quest_${quest.id}`,
      content: this.formatQuestContent(quest),
      metadata: {
        type: 'quest',
        userId,
        questId: quest.id,
        difficulty: quest.difficulty,
        progress: quest.progress,
        completed: quest.isCompleted === 'true',
        rewardXp: quest.rewardXp,
        rewardTokens: quest.rewardTokens,
        levelRequired: quest.levelRequired,
        requirements: quest.requirements
      },
      type: 'quest' as const,
      userId,
      createdAt: quest.createdAt,
      updatedAt: quest.updatedAt || quest.createdAt
    }));
  }

  /**
   * Get badge documents for indexing
   */
  private async getBadgeDocuments(userId: string): Promise<VectorDocument[]> {
    const badges = await this.prisma.badge.findMany({
      where: { userId }
    });

    return badges.map(badge => ({
      id: `badge_${badge.id}`,
      content: this.formatBadgeContent(badge),
      metadata: {
        type: 'badge',
        userId,
        badgeId: badge.id,
        badgeType: badge.type,
        rarity: badge.rarity,
        xpReward: badge.xpReward,
        tokenReward: badge.tokenReward,
        requirements: badge.requirements,
        isCompleted: badge.isCompleted === 'true'
      },
      type: 'badge' as const,
      userId,
      createdAt: badge.createdAt,
      updatedAt: badge.updatedAt || badge.createdAt
    }));
  }

  /**
   * Get user profile documents for indexing
   */
  private async getUserProfileDocuments(userId: string): Promise<VectorDocument[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSettings: true
      }
    });

    if (!user) return [];

    return [{
      id: `profile_${userId}`,
      content: this.formatUserProfileContent(user),
      metadata: {
        type: 'user_profile',
        userId,
        name: user.name,
        email: user.email,
        level: user.level,
        totalXp: user.totalXp,
        streak: user.streak,
        longestStreak: user.longestStreak,
        totalFocusMinutes: user.totalFocusMinutes,
        completedQuests: user.completedQuests,
        earnedBadges: user.earnedBadges,
        totalTokens: user.totalTokens,
        settings: user.userSettings
      },
      type: 'user_profile' as const,
      userId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }];
  }

  /**
   * Format task content for embedding
   */
  private formatTaskContent(task: any): string {
    let content = `Task: ${task.title}`;
    if (task.description) content += `\nDescription: ${task.description}`;
    content += `\nPriority: ${task.priority}`;
    if (task.category) content += `\nCategory: ${task.category}`;
    if (task.dueDate) content += `\nDue Date: ${task.dueDate}`;
    content += `\nStatus: ${task.completed ? 'Completed' : 'Pending'}`;
    if (task.estimatedMinutes) content += `\nEstimated Time: ${task.estimatedMinutes} minutes`;
    if (task.actualMinutes) content += `\nActual Time: ${task.actualMinutes} minutes`;
    if (task.goalIds.length > 0) content += `\nRelated Goals: ${task.goalIds.join(', ')}`;
    if (task.timerSessions.length > 0) content += `\nFocus Sessions: ${task.timerSessions.length}`;
    
    return content;
  }

  /**
   * Format goal content for embedding
   */
  private formatGoalContent(goal: any): string {
    let content = `Goal: ${goal.title}`;
    if (goal.description) content += `\nDescription: ${goal.description}`;
    content += `\nProgress: ${goal.progress}%`;
    if (goal.targetDate) content += `\nTarget Date: ${goal.targetDate}`;
    content += `\nStatus: ${goal.completed ? 'Completed' : 'In Progress'}`;
    if (goal.category) content += `\nCategory: ${goal.category}`;
    if (goal.taskIds.length > 0) content += `\nRelated Tasks: ${goal.taskIds.length}`;
    if (goal.topics.length > 0) content += `\nTopics: ${goal.topics.join(', ')}`;
    
    return content;
  }

  /**
   * Format note content for embedding
   */
  private formatNoteContent(note: any): string {
    let content = '';
    if (note.title) content += `Title: ${note.title}\n`;
    if (note.text) content += `Content: ${note.text}\n`;
    if (note.description) content += `Description: ${note.description}\n`;
    if (note.summary) content += `Summary: ${note.summary}\n`;
    if (note.aiSummary) content += `AI Summary: ${note.aiSummary}\n`;
    if (note.topics.length > 0) content += `Topics: ${note.topics.join(', ')}\n`;
    if (note.aiTopics.length > 0) content += `AI Topics: ${note.aiTopics.join(', ')}\n`;
    if (note.type) content += `Type: ${note.type}\n`;
    if (note.difficulty) content += `Difficulty: ${note.difficulty}\n`;
    
    return content;
  }

  /**
   * Format session content for embedding
   */
  private formatSessionContent(session: any): string {
    let content = `Focus Session: ${session.type}`;
    content += `\nDuration: ${session.duration} seconds`;
    content += `\nStatus: ${session.completed ? 'Completed' : 'Incomplete'}`;
    if (session.task) content += `\nTask: ${session.task.title}`;
    if (session.goal) content += `\nGoal: ${session.goal.title}`;
    if (session.note) content += `\nNote: ${session.note}`;
    if (session.mood) content += `\nMood: ${session.mood}`;
    if (session.energyLevel) content += `\nEnergy: ${session.energyLevel}`;
    if (session.productivityLevel) content += `\nProductivity: ${session.productivityLevel}`;
    if (session.activities.length > 0) content += `\nActivities: ${session.activities.join(', ')}`;
    if (session.persons.length > 0) content += `\nPeople: ${session.persons.join(', ')}`;
    if (session.location) content += `\nLocation: ${session.location}`;
    if (session.weather) content += `\nWeather: ${session.weather}`;
    
    return content;
  }

  /**
   * Format quest content for embedding
   */
  private formatQuestContent(quest: any): string {
    let content = `Quest: ${quest.name}`;
    if (quest.description) content += `\nDescription: ${quest.description}`;
    content += `\nDifficulty: ${quest.difficulty}`;
    content += `\nProgress: ${quest.progress}%`;
    content += `\nStatus: ${quest.isCompleted === 'true' ? 'Completed' : 'In Progress'}`;
    if (quest.rewardXp) content += `\nXP Reward: ${quest.rewardXp}`;
    if (quest.rewardTokens) content += `\nToken Reward: ${quest.rewardTokens}`;
    if (quest.levelRequired) content += `\nLevel Required: ${quest.levelRequired}`;
    if (quest.requirements.length > 0) content += `\nRequirements: ${quest.requirements.join(', ')}`;
    
    return content;
  }

  /**
   * Format badge content for embedding
   */
  private formatBadgeContent(badge: any): string {
    let content = `Badge: ${badge.name}`;
    if (badge.description) content += `\nDescription: ${badge.description}`;
    content += `\nType: ${badge.type}`;
    content += `\nRarity: ${badge.rarity}`;
    if (badge.xpReward) content += `\nXP Reward: ${badge.xpReward}`;
    if (badge.tokenReward) content += `\nToken Reward: ${badge.tokenReward}`;
    content += `\nStatus: ${badge.isCompleted === 'true' ? 'Earned' : 'Not Earned'}`;
    if (badge.requirements.length > 0) content += `\nRequirements: ${badge.requirements.join(', ')}`;
    
    return content;
  }

  /**
   * Format user profile content for embedding
   */
  private formatUserProfileContent(user: any): string {
    let content = `User Profile`;
    if (user.name) content += `\nName: ${user.name}`;
    if (user.email) content += `\nEmail: ${user.email}`;
    content += `\nLevel: ${user.level || 1}`;
    content += `\nTotal XP: ${user.totalXp || 0}`;
    content += `\nCurrent Streak: ${user.streak || 0} days`;
    content += `\nLongest Streak: ${user.longestStreak || 0} days`;
    content += `\nTotal Focus Minutes: ${user.totalFocusMinutes || 0}`;
    content += `\nCompleted Quests: ${user.completedQuests || 0}`;
    content += `\nEarned Badges: ${user.earnedBadges || 0}`;
    content += `\nTotal Tokens: ${user.totalTokens || 0}`;
    
    if (user.userSettings) {
      content += `\nDefault Focus Duration: ${user.userSettings.defaultFocusDuration} minutes`;
      content += `\nDefault Break Duration: ${user.userSettings.defaultBreakDuration} minutes`;
      content += `\nTheme: ${user.userSettings.theme}`;
    }
    
    return content;
  }

  /**
   * Index documents in the vector store
   */
  private async indexDocuments(documents: VectorDocument[]): Promise<void> {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap
    });

    const docs: Document[] = [];
    
    for (const doc of documents) {
      const chunks = await textSplitter.splitText(doc.content);
      
      for (let i = 0; i < chunks.length; i++) {
        docs.push(new Document({
          pageContent: chunks[i],
          metadata: {
            ...doc.metadata,
            chunkIndex: i,
            totalChunks: chunks.length,
            originalId: doc.id
          }
        }));
      }
    }

    if (docs.length > 0) {
      await this.vectorStore.addDocuments(docs);
      console.log(`Indexed ${docs.length} document chunks`);
    }
  }

  /**
   * Search for relevant documents
   */
  async search(
    query: string,
    userId: string,
    documentTypes?: string[],
    maxResults?: number
  ): Promise<SearchResult[]> {
    const results = await this.vectorStore.similaritySearchWithScore(
      query,
      maxResults || this.config.maxResults
    );

    return results
      .filter(([_, score]) => score >= (this.config.similarityThreshold || 0.7))
      .map(([doc, score]) => ({
        document: {
          id: doc.metadata.originalId,
          content: doc.pageContent,
          metadata: doc.metadata,
          type: doc.metadata.type,
          userId: doc.metadata.userId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        score,
        content: doc.pageContent,
        metadata: doc.metadata
      }))
      .filter(result => 
        result.document.userId === userId && 
        (!documentTypes || documentTypes.includes(result.document.type))
      );
  }

  /**
   * Get context from search results
   */
  async getContextFromSearch(
    query: string,
    userId: string,
    documentTypes?: string[],
    maxResults?: number
  ): Promise<string> {
    const results = await this.search(query, userId, documentTypes, maxResults);
    
    if (results.length === 0) {
      return 'No relevant information found.';
    }

    let context = 'Relevant Information:\n\n';
    
    for (const result of results) {
      context += `[${result.document.type.toUpperCase()}] ${result.content}\n\n`;
    }

    return context;
  }

  /**
   * Clear all documents for a user
   */
  async clearUserDocuments(userId: string): Promise<void> {
    // For MemoryVectorStore, we need to recreate it
    // In a production system, you'd use a persistent vector store
    this.vectorStore = new MemoryVectorStore(this.embeddings);
    console.log(`Cleared documents for user ${userId}`);
  }

  /**
   * Get indexing statistics
   */
  async getIndexingStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    users: string[];
  }> {
    // This is a simplified version for MemoryVectorStore
    // In production, you'd get this from your vector store
    return {
      totalDocuments: 0,
      totalChunks: 0,
      users: []
    };
  }
} 