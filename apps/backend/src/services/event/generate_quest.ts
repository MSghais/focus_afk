import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AiService } from '../../ai/ai';
import { DEFAULT_MODEL } from '../../config/models';
import { EnhancedQuestService } from '../enhancedQuestService';
import { PineconeService } from '../../ai/memory/pinecone.service';
import { EnhancedContextManager } from '../../ai/memory/enhancedContextManager';
import { MemoryManager } from '../../ai/memory/memoryManager';
import { GamificationService } from '../gamification.service';

const prisma = new PrismaClient();
const aiService = new AiService();

// Initialize enhanced quest service with dependencies
const pineconeService = new PineconeService(prisma);
const memoryManager = new MemoryManager(prisma);
const enhancedContextManager = new EnhancedContextManager(prisma, pineconeService, memoryManager);
const gamificationService = new GamificationService(
  prisma,
  process.env.RPC_URL || '',
  process.env.PRIVATE_KEY || '',
  process.env.FOCUS_TOKEN_ADDRESS || '',
  process.env.QUEST_NFT_ADDRESS || '',
  process.env.FOCUS_SBT_ADDRESS || ''
);
const enhancedQuestService = new EnhancedQuestService(
  prisma,
  pineconeService,
  enhancedContextManager,
  gamificationService
);

function isToday(date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// Enhanced function to get personalized user context
async function getUserPersonalizedContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasks: { 
        take: 50,
        orderBy: { createdAt: 'desc' }
      },
      goals: { 
        take: 20,
        orderBy: { createdAt: 'desc' }
      },
      timerSessions: { 
        take: 100,
        orderBy: { createdAt: 'desc' }
      },
      quests: { 
        take: 100,
        orderBy: { dateAwarded: 'desc' }
      },
      notes: {
        take: 50,
        orderBy: { createdAt: 'desc' }
      },
      userSettings: true,
      chats: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        },
        take: 10
      }
    }
  });

  if (!user) return null;

  // Analyze user preferences and patterns
  const preferences = await analyzeUserPreferences(user);
  
  // Get recent activity patterns
  const recentActivity = analyzeRecentActivity(user);
  
  // Get user's current state and challenges
  const currentState = analyzeCurrentState(user);
  
  // Get personalized insights
  const insights = await generatePersonalizedInsights(user, preferences, recentActivity);

  return {
    user,
    preferences,
    recentActivity,
    currentState,
    insights
  };
}

// Enhanced user preference analysis
async function analyzeUserPreferences(user: any) {
  const preferences = {
    preferredCategories: [] as string[],
    difficultyPreference: 2,
    timeOfDay: 'any' as 'morning' | 'afternoon' | 'evening' | 'any',
    focusDuration: 25,
    preferredQuestTypes: [] as string[],
    productivityPatterns: {} as Record<string, any>
  };

  // Analyze task categories and priorities
  const taskCategories = user.tasks.map((t: any) => t.category).filter(Boolean);
  if (taskCategories.length > 0) {
    const categoryCounts = taskCategories.reduce((acc: any, cat: string) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    preferences.preferredCategories = Object.entries(categoryCounts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
  }

  // Analyze difficulty preference from completed quests
  const completedQuests = user.quests.filter((q: any) => q.isCompleted === 'true');
  if (completedQuests.length > 0) {
    const avgDifficulty = completedQuests.reduce((sum: number, q: any) => sum + (q.difficulty || 2), 0) / completedQuests.length;
    preferences.difficultyPreference = Math.round(avgDifficulty);
  }

  // Analyze time of day preference from focus sessions
  const focusSessions = user.timerSessions.filter((s: any) => s.type === 'focus');
  if (focusSessions.length > 0) {
    const hourCounts = focusSessions.reduce((acc: any, session: any) => {
      const hour = new Date(session.createdAt).getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {});

    const preferredTime = Object.entries(hourCounts)
      .sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] as any;
    
    if (preferredTime) {
      preferences.timeOfDay = preferredTime;
    }

    // Analyze focus duration patterns
    const avgDuration = focusSessions.reduce((sum: number, s: any) => sum + (s.duration || 25), 0) / focusSessions.length;
    preferences.focusDuration = Math.round(avgDuration);
  }

  // Analyze quest type preferences
  const questTypes = user.quests.map((q: any) => q.type).filter(Boolean);
  if (questTypes.length > 0) {
    const typeCounts = questTypes.reduce((acc: any, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    preferences.preferredQuestTypes = Object.entries(typeCounts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  // Get user settings
  if (user.userSettings) {
    preferences.focusDuration = user.userSettings.defaultFocusDuration || 25;
  }

  return preferences;
}

// Analyze recent user activity patterns
function analyzeRecentActivity(user: any) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentActivity = {
    focusSessions: user.timerSessions.filter((s: any) => s.createdAt >= dayAgo).length,
    completedTasks: user.tasks.filter((t: any) => t.completed && t.updatedAt >= dayAgo).length,
    completedGoals: user.goals.filter((g: any) => g.completed && g.updatedAt >= dayAgo).length,
    totalFocusMinutes: user.timerSessions
      .filter((s: any) => s.createdAt >= dayAgo)
      .reduce((sum: number, s: any) => sum + (s.duration || 0), 0),
    streak: user.streak || 0,
    level: user.level || 1,
    lastActive: user.updatedAt,
    productivityTrend: 'stable' as 'improving' | 'declining' | 'stable'
  };

  // Calculate productivity trend
  const weekSessions = user.timerSessions.filter((s: any) => s.createdAt >= weekAgo);
  const firstHalf = weekSessions.slice(0, Math.floor(weekSessions.length / 2));
  const secondHalf = weekSessions.slice(Math.floor(weekSessions.length / 2));
  
  const firstHalfMinutes = firstHalf.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
  const secondHalfMinutes = secondHalf.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
  
  if (secondHalfMinutes > firstHalfMinutes * 1.2) {
    recentActivity.productivityTrend = 'improving';
  } else if (secondHalfMinutes < firstHalfMinutes * 0.8) {
    recentActivity.productivityTrend = 'declining';
  }

  return recentActivity;
}

// Analyze current user state and challenges
function analyzeCurrentState(user: any) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const currentState = {
    incompleteTasks: user.tasks.filter((t: any) => !t.completed).length,
    overdueTasks: user.tasks.filter((t: any) => !t.completed && t.dueDate && t.dueDate < today).length,
    activeGoals: user.goals.filter((g: any) => !g.completed).length,
    recentNotes: user.notes.filter((n: any) => n.createdAt >= today).length,
    currentStreak: user.streak || 0,
    energyLevel: calculateEnergyLevel(user),
    focusAreas: identifyFocusAreas(user)
  };

  return currentState;
}

// Calculate user's current energy level based on recent activity
function calculateEnergyLevel(user: any) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentSessions = user.timerSessions.filter((s: any) => s.createdAt >= dayAgo);
  const totalFocusMinutes = recentSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
  
  if (totalFocusMinutes > 240) return 'high';
  if (totalFocusMinutes > 120) return 'medium';
  return 'low';
}

// Identify areas where user needs to focus
function identifyFocusAreas(user: any) {
  const focusAreas: string[] = [];
  
  const incompleteTasks = user.tasks.filter((t: any) => !t.completed);
  const overdueTasks = user.tasks.filter((t: any) => !t.completed && t.dueDate && t.dueDate < new Date());
  
  if (overdueTasks.length > 0) {
    focusAreas.push('overdue_tasks');
  }
  
  if (incompleteTasks.length > 5) {
    focusAreas.push('task_management');
  }
  
  const activeGoals = user.goals.filter((g: any) => !g.completed);
  if (activeGoals.length === 0) {
    focusAreas.push('goal_setting');
  }
  
  const recentSessions = user.timerSessions.filter((s: any) => 
    s.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  if (recentSessions.length < 3) {
    focusAreas.push('focus_consistency');
  }
  
  return focusAreas;
}

// Generate personalized insights for quest creation
async function generatePersonalizedInsights(user: any, preferences: any, recentActivity: any) {
  const insights: Array<{
    type: string;
    message: string;
    difficulty: number;
    rewardXp: number;
  }> = [];
  
  // Analyze task completion patterns
  const incompleteTasks = user.tasks.filter((t: any) => !t.completed);
  if (incompleteTasks.length > 0) {
    const highPriorityTasks = incompleteTasks.filter((t: any) => t.priority === 'high');
    if (highPriorityTasks.length > 0) {
      insights.push({
        type: 'priority_task_focus',
        message: `You have ${highPriorityTasks.length} high-priority tasks waiting. Focus on completing them first.`,
        difficulty: 3,
        rewardXp: 200
      });
    }
  }
  
  // Analyze goal progress
  const activeGoals = user.goals.filter((g: any) => !g.completed);
  if (activeGoals.length > 0) {
    insights.push({
      type: 'goal_progress',
      message: `You have ${activeGoals.length} active goals. Make progress on at least one today.`,
      difficulty: 2,
      rewardXp: 150
    });
  }
  
  // Analyze focus patterns
  if (recentActivity.focusSessions < 2) {
    insights.push({
      type: 'focus_consistency',
      message: 'Build your focus habit with a short session today.',
      difficulty: 1,
      rewardXp: 100
    });
  }
  
  // Analyze streak maintenance
  if (recentActivity.streak > 0) {
    insights.push({
      type: 'streak_maintenance',
      message: `Maintain your ${recentActivity.streak}-day streak!`,
      difficulty: 1,
      rewardXp: 50
    });
  }
  
  return insights;
}

export const generateDailyQuest = async (socket: Socket) => {
  try {
    const userId = socket.data.user?.id;
    if (!userId) return;

    // Check if a quest was already generated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingQuest = await prisma.quests.findFirst({
      where: {
        userId,
        dateAwarded: { gte: today },
      },
    });

    console.log('Existing quest:', existingQuest);
    if (existingQuest) {
      socket.emit('quest_of_the_day', existingQuest);
      return;
    }

    // Get personalized user context
    const userContext = await getUserPersonalizedContext(userId);
    if (!userContext) {
      console.error('Could not get user context for:', userId);
      return;
    }

    const { user, preferences, recentActivity, currentState, insights } = userContext;

    // Compose enhanced prompt with personalized context
    const prompt = `Generate a highly personalized, motivating quest for today for this user based on their specific context:

USER PROFILE:
- Level: ${(user as any).level || 1}
- Total XP: ${(user as any).totalXp || 0}
- Current Streak: ${recentActivity.streak} days
- Preferred Categories: ${preferences.preferredCategories.join(', ') || 'None specified'}
- Difficulty Preference: ${preferences.difficultyPreference}/5
- Preferred Time: ${preferences.timeOfDay}
- Focus Duration: ${preferences.focusDuration} minutes

CURRENT STATE:
- Incomplete Tasks: ${currentState.incompleteTasks}
- Overdue Tasks: ${currentState.overdueTasks}
- Active Goals: ${currentState.activeGoals}
- Energy Level: ${currentState.energyLevel}
- Focus Areas: ${currentState.focusAreas.join(', ')}

RECENT ACTIVITY:
- Focus Sessions Today: ${recentActivity.focusSessions}
- Completed Tasks Today: ${recentActivity.completedTasks}
- Total Focus Minutes Today: ${recentActivity.totalFocusMinutes}
- Productivity Trend: ${recentActivity.productivityTrend}

PERSONALIZED INSIGHTS:
${insights.map(insight => `- ${insight.message}`).join('\n')}

TODAY'S TASKS:
${user.tasks.filter(t => !t.completed).slice(0, 5).map(t => `- ${t.title}: ${t.description || ''} ${t.priority === 'high' ? '(HIGH PRIORITY)' : ''}`).join('\n')}

ACTIVE GOALS:
${user.goals.filter(g => !g.completed).slice(0, 3).map(g => `- ${g.title}: ${g.description || ''}`).join('\n')}

RECENT MESSAGES (for context):
${user.chats.flatMap(chat => chat.messages).slice(0, 10).map(m => `- ${m.content}`).join('\n')}

Create a quest that is:
1. SPECIFIC to this user's current situation and preferences
2. ACHIEVABLE today given their energy level and schedule
3. MOTIVATING based on their streak and progress
4. PERSONALIZED to their preferred categories and difficulty
5. CONTEXTUAL to their current challenges and goals

Format as: "Quest Title" followed by a 2-3 sentence personalized description that references their specific situation.`;

    // Call AI to generate personalized quest
    const aiResult = await aiService.generateTextLlm({
      model: DEFAULT_MODEL,
      prompt,
      systemPrompt: `You are an expert productivity mentor who creates highly personalized daily quests. You understand each user's unique context, preferences, and current challenges. Create quests that feel specifically tailored to the individual user, referencing their actual tasks, goals, and recent activity. Make the quest description personal and motivating.`
    });

    const questText = aiResult?.text || 'Complete a meaningful task today!';
    const [title, ...descArr] = questText.split('\n');
    const name = title?.trim() || 'Daily Quest';
    const description = descArr.join(' ').trim() || questText;

    // Calculate personalized rewards based on user context
    const baseRewardXp = 100;
    const difficultyMultiplier = preferences.difficultyPreference / 3;
    const streakBonus = Math.min(recentActivity.streak * 5, 50);
    const personalizedRewardXp = Math.round(baseRewardXp * difficultyMultiplier + streakBonus);

    // Save personalized quest to DB
    const quest = await prisma.quests.create({
      data: {
        userId,
        name,
        description,
        type: 'daily',
        dateAwarded: new Date(),
        difficulty: preferences.difficultyPreference,
        rewardXp: personalizedRewardXp,
        rewardTokens: Math.round(personalizedRewardXp / 10),
        meta: {
          personalized: true,
          userPreferences: preferences,
          currentState,
          insights: insights.map(i => ({ type: i.type, message: i.message })),
          generatedAt: new Date().toISOString()
        }
      },
    });

    console.log('Generated personalized quest:', quest);
    
    // Emit personalized quest to user
    socket.emit('quest_of_the_day', quest);

    // Optionally generate additional contextual quests using enhanced service
    try {
      const additionalQuests = await enhancedQuestService.sendContextualQuests(
        userId, 
        user.userAddress, 
        'task_completion'
      );
      
      if (additionalQuests.length > 0) {
        // Emit additional quests as suggestions
        socket.emit('quest_suggestions', additionalQuests.slice(0, 3));
      }
    } catch (error) {
      console.error('Error generating additional quests:', error);
    }

  } catch (err) {
    console.error('Error generating daily quest:', err);
    // Fallback to basic quest
    try {
      const fallbackQuest = await prisma.quests.create({
        data: {
          userId: socket.data.user?.id,
          name: 'Daily Focus Challenge',
          description: 'Complete at least one meaningful task today and maintain your focus streak!',
          type: 'daily',
          dateAwarded: new Date(),
          difficulty: 2,
          rewardXp: 100
        },
      });
      socket.emit('quest_of_the_day', fallbackQuest);
    } catch (fallbackErr) {
      console.error('Fallback quest creation failed:', fallbackErr);
    }
  }
};