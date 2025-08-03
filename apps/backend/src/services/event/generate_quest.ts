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


// Function to generate tailored quests based on user's current tasks and goals
export async function generateTailoredQuests(userId: string, userAddress: string) {
  try {
    // Get user's current tasks and goals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: { 
          where: { completed: false },
          take: 20,
          orderBy: { createdAt: 'desc' }
        },
        goals: { 
          where: { completed: false },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        timerSessions: { 
          take: 50,
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) return [];

    const tailoredQuests: Array<{
      name: string;
      description: string;
      difficulty: number;
      rewardXp: number;
      category: string;
      status: string;
      progress: number;
      goal: number;
    }> = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. High-Priority Task Focus (Highest Priority)
    const highPriorityTasks = user.tasks.filter(t => t.priority === 'high');
    if (highPriorityTasks.length > 0) {
      const task = highPriorityTasks[0];
      tailoredQuests.push({
        name: `Complete High-Priority Task`,
        description: `Focus on completing "${task.title}" - this is marked as high priority and needs your attention today.`,
        difficulty: 3,
        rewardXp: 200,
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: 1
      });
    }

    // 2. Overdue Task Recovery
    const overdueTasks = user.tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today);
    if (overdueTasks.length > 0 && !highPriorityTasks.length) {
      const task = overdueTasks[0];
      tailoredQuests.push({
        name: `Catch Up on Overdue Task`,
        description: `Complete "${task.title}" which was due ${task.dueDate?.toLocaleDateString()}. Let's get back on track!`,
        difficulty: 2,
        rewardXp: 150,
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: 1
      });
    }

    // 3. Goal Progress Quest
    const activeGoals = user.goals.filter(g => !g.completed);
    if (activeGoals.length > 0 && !highPriorityTasks.length && !overdueTasks.length) {
      const goal = activeGoals[0];
      tailoredQuests.push({
        name: `Progress on Goal`,
        description: `Make progress on your goal "${goal.title}". Every step counts towards your success!`,
        difficulty: 2,
        rewardXp: 150,
        category: 'goals',
        status: 'active',
        progress: 0,
        goal: 1
      });
    }

    // 4. Task Completion Streak
    const completedTasksThisWeek = user.tasks.filter(t => 
      t.completed && t.updatedAt && t.updatedAt >= weekAgo
    ).length;
    if (completedTasksThisWeek < 3) {
      tailoredQuests.push({
        name: `Build Task Completion Momentum`,
        description: `Complete at least 3 tasks this week. You've completed ${completedTasksThisWeek} so far - keep going!`,
        difficulty: 2,
        rewardXp: 120,
        category: 'tasks',
        status: 'active',
        progress: completedTasksThisWeek,
        goal: 3
      });
    }

    // 5. Focus Session Quest
    const recentSessions = user.timerSessions.filter(s => s.createdAt >= today);
    const totalFocusMinutes = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    if (recentSessions.length === 0) {
      tailoredQuests.push({
        name: `Start Your Focus Journey`,
        description: `Begin your productivity journey today with a focused 25-minute session. Build momentum!`,
        difficulty: 1,
        rewardXp: 100,
        category: 'focus',
        status: 'active',
        progress: 0,
        goal: 1
      });
    } else if (totalFocusMinutes < 60) {
      tailoredQuests.push({
        name: `Extend Your Focus Time`,
        description: `You've focused for ${totalFocusMinutes} minutes today. Aim for at least 60 minutes of focused work!`,
        difficulty: 2,
        rewardXp: 150,
        category: 'focus',
        status: 'active',
        progress: totalFocusMinutes,
        goal: 60
      });
    }

    // 6. Note Taking Quest
    const recentNotes = user.notes.filter(n => n.createdAt >= today);
    if (recentNotes.length === 0 && user.notes.length > 0) {
      tailoredQuests.push({
        name: `Capture Today's Insights`,
        description: `Take a note about something you learned or accomplished today. Knowledge builds over time!`,
        difficulty: 1,
        rewardXp: 80,
        category: 'notes',
        status: 'active',
        progress: 0,
        goal: 1
      });
    }

    // 7. Streak Maintenance Quest
    if ((user as any).streak && (user as any).streak > 0) {
      tailoredQuests.push({
        name: `Maintain Your Streak`,
        description: `Keep your ${(user as any).streak}-day focus streak alive! Complete at least one meaningful task today.`,
        difficulty: 1,
        rewardXp: 50 + ((user as any).streak * 5),
        category: 'streak',
        status: 'active',
        progress: 0,
        goal: 1
      });
    }

    // 8. Task Organization Quest
    const unorganizedTasks = user.tasks.filter(t => !t.category || t.category === '');
    if (unorganizedTasks.length > 5) {
      tailoredQuests.push({
        name: `Organize Your Tasks`,
        description: `You have ${unorganizedTasks.length} uncategorized tasks. Add categories to 3 tasks to better organize your work.`,
        difficulty: 1,
        rewardXp: 100,
        category: 'organization',
        status: 'active',
        progress: 0,
        goal: 3
      });
    }

    // 9. Learning Quest (if user has learning-related tasks)
    const learningTasks = user.tasks.filter(t => 
      t.title.toLowerCase().includes('learn') || 
      t.title.toLowerCase().includes('study') ||
      t.title.toLowerCase().includes('practice') ||
      t.category?.toLowerCase().includes('learning')
    );
    if (learningTasks.length > 0) {
      const learningTask = learningTasks[0];
      tailoredQuests.push({
        name: `Dedicate Time to Learning`,
        description: `Spend focused time on "${learningTask.title}". Learning is an investment in your future!`,
        difficulty: 2,
        rewardXp: 180,
        category: 'learning',
        status: 'active',
        progress: 0,
        goal: 1
      });
    }

    // 10. Productivity Challenge Quest
    const totalTasks = user.tasks.length;
    const completedTasks = user.tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    if (completionRate < 70 && totalTasks > 5) {
      tailoredQuests.push({
        name: `Boost Your Completion Rate`,
        description: `Your task completion rate is ${Math.round(completionRate)}%. Complete 2 more tasks to improve it!`,
        difficulty: 2,
        rewardXp: 160,
        category: 'productivity',
        status: 'active',
        progress: completedTasks,
        goal: completedTasks + 2
      });
    }

    return tailoredQuests;

  } catch (error) {
    console.error('Error generating tailored quests:', error);
    return [];
  }
}


// Enhanced function to generate personalized quest using enhanced service
export async function generatePersonalizedQuest(socket: Socket) {
  try {
    const userId = socket.data.user?.id;
    const userAddress = socket.data.user?.userAddress;
    
    if (!userId || !userAddress) {
      console.error('Missing user ID or address for personalized quest generation');
      return;
    }

    // Check if a quest was already generated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingQuest = await prisma.quests.findFirst({
      where: {
        userId,
        dateAwarded: { gte: today },
      },
    });

    // If we have an existing quest, check if it's tailored
    if (existingQuest) {
      const isTailored = existingQuest.meta && 
        (existingQuest.meta as any).tailored === true;
      
      if (isTailored) {
        console.log('Existing tailored quest found, sending to user:', existingQuest);
        socket.emit('quest_of_the_day', existingQuest);
        return;
      } else {
        console.log('Existing generic quest found, will generate new tailored quest instead');
        // Continue to generate a new tailored quest
      }
    }

    console.log('Generating personalized quest for user:', userId);

    // First, try to generate tailored quests based on user's current tasks and goals
    const tailoredQuests = await generateTailoredQuests(userId, userAddress);
    
    if (tailoredQuests && tailoredQuests.length > 0) {
      // Use the first tailored quest as the daily quest
      const tailoredQuest = tailoredQuests[0];
      
      // If there's an existing quest, update it instead of creating a new one
      let quest;
      if (existingQuest) {
        quest = await prisma.quests.update({
          where: { id: existingQuest.id },
          data: {
            name: tailoredQuest.name,
            description: tailoredQuest.description,
            type: 'daily',
            difficulty: tailoredQuest.difficulty,
            rewardXp: tailoredQuest.rewardXp,
            meta: {
              personalized: true,
              tailored: true,
              category: tailoredQuest.category,
              status: tailoredQuest.status,
              progress: tailoredQuest.progress,
              goal: tailoredQuest.goal,
              generatedAt: new Date().toISOString(),
              vectorContextUsed: true
            }
          },
        });
      } else {
        quest = await prisma.quests.create({
          data: {
            userId,
            name: tailoredQuest.name,
            description: tailoredQuest.description,
            type: 'daily',
            dateAwarded: new Date(),
            difficulty: tailoredQuest.difficulty,
            rewardXp: tailoredQuest.rewardXp,
            meta: {
              personalized: true,
              tailored: true,
              category: tailoredQuest.category,
              status: tailoredQuest.status,
              progress: tailoredQuest.progress,
              goal: tailoredQuest.goal,
              generatedAt: new Date().toISOString(),
              vectorContextUsed: true
            }
          },
        });
      }

      console.log('Generated tailored quest:', quest);
      socket.emit('quest_of_the_day', quest);

      // Send additional tailored quests as suggestions
      if (tailoredQuests.length > 1) {
        const additionalQuests = tailoredQuests.slice(1, 3); // Send up to 2 additional quests
        socket.emit('quest_suggestions', additionalQuests);
      }

      return quest;
    }

    // If no tailored quests, try enhanced quest service
    console.log('No tailored quests found, trying enhanced quest service');
    // const enhancedQuests = await enhancedQuestService.generateQuestsForUser(userId, userAddress);
    
    // if (enhancedQuests && enhancedQuests.length > 0) {
    //   const enhancedQuest = enhancedQuests[0];
      
    //   // If there's an existing quest, update it instead of creating a new one
    //   let quest;
    //   if (existingQuest) {
    //     quest = await prisma.quests.update({
    //       where: { id: existingQuest.id },
    //       data: {
    //         name: enhancedQuest.name,
    //         description: enhancedQuest.description,
    //         type: 'daily',
    //         difficulty: enhancedQuest.difficulty,
    //         rewardXp: enhancedQuest.rewardXp,
    //         meta: {
    //           personalized: true,
    //           tailored: false,
    //           enhanced: true,
    //           category: enhancedQuest.category,
    //           status: enhancedQuest.status,
    //           progress: enhancedQuest.progress,
    //           goal: enhancedQuest.goal,
    //           generatedAt: new Date().toISOString(),
    //           vectorContextUsed: true
    //         }
    //       },
    //     });
    //   } else {
    //     quest = await prisma.quests.create({
    //       data: {
    //         userId,
    //         name: enhancedQuest.name,
    //         description: enhancedQuest.description,
    //         type: 'daily',
    //         dateAwarded: new Date(),
    //         difficulty: enhancedQuest.difficulty,
    //         rewardXp: enhancedQuest.rewardXp,
    //         meta: {
    //           personalized: true,
    //           tailored: false,
    //           enhanced: true,
    //           category: enhancedQuest.category,
    //           status: enhancedQuest.status,
    //           progress: enhancedQuest.progress,
    //           goal: enhancedQuest.goal,
    //           generatedAt: new Date().toISOString(),
    //           vectorContextUsed: true
    //         }
    //       },
    //     });
    //   }

    //   console.log('Generated enhanced quest:', quest);
    //   socket.emit('quest_of_the_day', quest);

    //   return quest;
    // }

    // Only if no tailored or enhanced quests are available, fall back to basic quest
    console.log('No tailored or enhanced quests available, falling back to basic quest');
    throw new Error('No tailored or enhanced quests generated');

  } catch (error) {
    console.error('Error generating personalized quest:', error);
    // Fallback to basic quest generation
    return await generateDailyQuest(socket);
  }
}
