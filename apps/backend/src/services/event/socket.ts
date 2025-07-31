import { Server, Socket } from 'socket.io';
import { streamEvents, STREAM_EVENTS } from './index';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateDailyQuest } from './generate_quest';
import { EnhancedQuestService } from '../enhancedQuestService';
import { PineconeService } from '../../ai/memory/pinecone.service';
import { EnhancedContextManager } from '../../ai/memory/enhancedContextManager';
import { MemoryManager } from '../../ai/memory/memoryManager';
import { GamificationService } from '../gamification.service';

const prisma = new PrismaClient();

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

// Enhanced function to generate personalized quest using enhanced service
async function generatePersonalizedQuest(socket: Socket) {
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
    const enhancedQuests = await enhancedQuestService.generateQuestsForUser(userId, userAddress);
    
    if (enhancedQuests && enhancedQuests.length > 0) {
      const enhancedQuest = enhancedQuests[0];
      
      // If there's an existing quest, update it instead of creating a new one
      let quest;
      if (existingQuest) {
        quest = await prisma.quests.update({
          where: { id: existingQuest.id },
          data: {
            name: enhancedQuest.name,
            description: enhancedQuest.description,
            type: 'daily',
            difficulty: enhancedQuest.difficulty,
            rewardXp: enhancedQuest.rewardXp,
            meta: {
              personalized: true,
              tailored: false,
              enhanced: true,
              category: enhancedQuest.category,
              status: enhancedQuest.status,
              progress: enhancedQuest.progress,
              goal: enhancedQuest.goal,
              generatedAt: new Date().toISOString(),
              vectorContextUsed: true
            }
          },
        });
      } else {
        quest = await prisma.quests.create({
          data: {
            userId,
            name: enhancedQuest.name,
            description: enhancedQuest.description,
            type: 'daily',
            dateAwarded: new Date(),
            difficulty: enhancedQuest.difficulty,
            rewardXp: enhancedQuest.rewardXp,
            meta: {
              personalized: true,
              tailored: false,
              enhanced: true,
              category: enhancedQuest.category,
              status: enhancedQuest.status,
              progress: enhancedQuest.progress,
              goal: enhancedQuest.goal,
              generatedAt: new Date().toISOString(),
              vectorContextUsed: true
            }
          },
        });
      }

      console.log('Generated enhanced quest:', quest);
      socket.emit('quest_of_the_day', quest);

      return quest;
    }

    // Only if no tailored or enhanced quests are available, fall back to basic quest
    console.log('No tailored or enhanced quests available, falling back to basic quest');
    throw new Error('No tailored or enhanced quests generated');

  } catch (error) {
    console.error('Error generating personalized quest:', error);
    // Fallback to basic quest generation
    return await generateDailyQuest(socket);
  }
}

// Function to generate tailored quests based on user's current tasks and goals
async function generateTailoredQuests(userId: string, userAddress: string) {
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

export const setupWebSocket = (io: Server) => {
  io.on(STREAM_EVENTS.CONNECT, (socket: Socket) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      // Try to verify JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        if (typeof decoded === 'object' && decoded !== null) {
          socket.data.user = decoded;
          // JwtPayload may have an 'id' property, but it's not guaranteed by type
          // So we use optional chaining and fallback to 'unknown'
          console.log('Authenticated WebSocket user:', (decoded as any)?.id ?? 'unknown');
          
          // Attach authed_connection handler to this socket
          socket.on('authed_connection', async () => {
            try {
              // Use enhanced personalized quest generation by default
              await generatePersonalizedQuest(socket);
            } catch (err) {
              console.error('Error in authed_connection quest generation:', err);
              // Fallback to basic quest
              try {
                await generateDailyQuest(socket);
              } catch (fallbackErr) {
                console.error('Fallback quest generation also failed:', fallbackErr);
              }
            }
          });
          
          // Attach quest_of_the_day handler to this socket
          socket.on(STREAM_EVENTS.GENERATE_DAILY_QUEST, async () => {
            console.log('Quest of the day requested:', socket.id);
            try {
              // Use enhanced personalized quest generation
              await generatePersonalizedQuest(socket);
            } catch (err) {
              console.error('Error in manual quest generation:', err);
              // Fallback to basic quest
              try {
                await generateDailyQuest(socket);
              } catch (fallbackErr) {
                console.error('Fallback quest generation also failed:', fallbackErr);
              }
            }
          });
          
          // Attach ping-pong test handler
          socket.on('ping', () => {
            console.log('Received ping from client:', socket.id);
            socket.emit('pong');
            console.log('Sent pong to client:', socket.id);
          });

          // Add handler for enhanced quest requests
          socket.on('request_enhanced_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const enhancedQuests = await enhancedQuestService.generateQuestsForUser(userId, userAddress);
                socket.emit('enhanced_quests_response', {
                  quests: enhancedQuests,
                  message: 'Enhanced quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating enhanced quests:', error);
              socket.emit('enhanced_quests_response', {
                quests: [],
                message: 'Failed to generate enhanced quests',
                error: error.message
              });
            }
          });

          // Add handler for task-based quest generation
          socket.on('request_task_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const taskQuests = await enhancedQuestService.generatePriorityQuestSuggestions(userId, userAddress);
                socket.emit('task_quests_response', {
                  quests: taskQuests,
                  message: 'Task-based quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating task quests:', error);
              socket.emit('task_quests_response', {
                quests: [],
                message: 'Failed to generate task quests',
                error: error.message
              });
            }
          });

          // Add handler for focus-based quest generation
          socket.on('request_focus_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const userContext = await enhancedQuestService['buildUserContext'](userId, userAddress);
                const vectorContext = await enhancedQuestService['getVectorContext'](userId, userContext);
                const focusQuests = await enhancedQuestService['generateFocusSessionQuests'](userContext, vectorContext);
                socket.emit('focus_quests_response', {
                  quests: focusQuests,
                  message: 'Focus-based quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating focus quests:', error);
              socket.emit('focus_quests_response', {
                quests: [],
                message: 'Failed to generate focus quests',
                error: error.message
              });
            }
          });

          // Add handler for goal-based quest generation
          socket.on('request_goal_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const userContext = await enhancedQuestService['buildUserContext'](userId, userAddress);
                const vectorContext = await enhancedQuestService['getVectorContext'](userId, userContext);
                const goalQuests = await enhancedQuestService['generateGoalProgressQuests'](userContext, vectorContext);
                socket.emit('goal_quests_response', {
                  quests: goalQuests,
                  message: 'Goal-based quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating goal quests:', error);
              socket.emit('goal_quests_response', {
                quests: [],
                message: 'Failed to generate goal quests',
                error: error.message
              });
            }
          });

          // Add handler for quick win quest generation
          socket.on('request_quick_win_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const userContext = await enhancedQuestService['buildUserContext'](userId, userAddress);
                const vectorContext = await enhancedQuestService['getVectorContext'](userId, userContext);
                const quickWinQuests = await enhancedQuestService['generateQuickWinQuests'](userContext, vectorContext);
                socket.emit('quick_win_quests_response', {
                  quests: quickWinQuests,
                  message: 'Quick win quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating quick win quests:', error);
              socket.emit('quick_win_quests_response', {
                quests: [],
                message: 'Failed to generate quick win quests',
                error: error.message
              });
            }
          });

          // Add handler for learning quest generation
          socket.on('request_learning_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const learningQuests = await enhancedQuestService.createGenericQuest({
                  userId,
                  userAddress,
                  name: '📚 Learning Explorer',
                  description: 'Dive into a new topic or skill for 30 minutes',
                  category: 'learning',
                  difficulty: 2,
                  rewardXp: 120,
                  rewardTokens: 12,
                  completionCriteria: { type: 'duration', target: 30, unit: 'minutes' },
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                  tags: ['learning', 'skill-development'],
                  priority: 'medium'
                });
                socket.emit('learning_quests_response', {
                  quests: [learningQuests],
                  message: 'Learning quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating learning quests:', error);
              socket.emit('learning_quests_response', {
                quests: [],
                message: 'Failed to generate learning quests',
                error: error.message
              });
            }
          });

          // Add handler for wellness quest generation
          socket.on('request_wellness_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const wellnessQuests = await enhancedQuestService.createGenericQuest({
                  userId,
                  userAddress,
                  name: '🧘 Wellness Break',
                  description: 'Take a 15-minute wellness break - stretch, meditate, or go for a walk',
                  category: 'custom',
                  difficulty: 1,
                  rewardXp: 80,
                  rewardTokens: 8,
                  completionCriteria: { type: 'duration', target: 15, unit: 'minutes' },
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                  tags: ['wellness', 'self-care'],
                  priority: 'high'
                });
                socket.emit('wellness_quests_response', {
                  quests: [wellnessQuests],
                  message: 'Wellness quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating wellness quests:', error);
              socket.emit('wellness_quests_response', {
                quests: [],
                message: 'Failed to generate wellness quests',
                error: error.message
              });
            }
          });

          // Add handler for social quest generation
          socket.on('request_social_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const socialQuests = await enhancedQuestService.createGenericQuest({
                  userId,
                  userAddress,
                  name: '🤝 Social Connection',
                  description: 'Reach out to a colleague or friend for a quick chat or collaboration',
                  category: 'social',
                  difficulty: 2,
                  rewardXp: 100,
                  rewardTokens: 10,
                  completionCriteria: { type: 'count', target: 1 },
                  expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                  tags: ['social', 'networking'],
                  priority: 'medium'
                });
                socket.emit('social_quests_response', {
                  quests: [socialQuests],
                  message: 'Social quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating social quests:', error);
              socket.emit('social_quests_response', {
                quests: [],
                message: 'Failed to generate social quests',
                error: error.message
              });
            }
          });

          // Add handler for streak-based quest generation
          socket.on('request_streak_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const userContext = await enhancedQuestService['buildUserContext'](userId, userAddress);
                const vectorContext = await enhancedQuestService['getVectorContext'](userId, userContext);
                const streakQuests = await enhancedQuestService['generateStreakMilestoneQuests'](userContext, vectorContext);
                socket.emit('streak_quests_response', {
                  quests: streakQuests,
                  message: 'Streak-based quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating streak quests:', error);
              socket.emit('streak_quests_response', {
                quests: [],
                message: 'Failed to generate streak quests',
                error: error.message
              });
            }
          });

          // Add handler for note-based quest generation
          socket.on('request_note_quests', async () => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const userContext = await enhancedQuestService['buildUserContext'](userId, userAddress);
                const vectorContext = await enhancedQuestService['getVectorContext'](userId, userContext);
                const noteQuests = await enhancedQuestService['generateNoteCreationQuests'](userContext, vectorContext);
                socket.emit('note_quests_response', {
                  quests: noteQuests,
                  message: 'Note-based quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating note quests:', error);
              socket.emit('note_quests_response', {
                quests: [],
                message: 'Failed to generate note quests',
                error: error.message
              });
            }
          });

          // Add handler for contextual quest requests
          socket.on('request_contextual_quests', async (triggerPoint: string) => {
            try {
              const userId = socket.data.user?.id;
              const userAddress = socket.data.user?.userAddress;
              
              if (userId && userAddress) {
                const contextualQuests = await enhancedQuestService.sendContextualQuests(
                  userId, 
                  userAddress, 
                  triggerPoint as any
                );
                socket.emit('contextual_quests_response', {
                  quests: contextualQuests,
                  triggerPoint,
                  message: 'Contextual quests generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating contextual quests:', error);
              socket.emit('contextual_quests_response', {
                quests: [],
                triggerPoint,
                message: 'Failed to generate contextual quests',
                error: error.message
              });
            }
          });
        }
      } catch (err) {
        console.error('JWT verification failed:', err);
      }
    } else {
      // No token: treat as public/unauthenticated
      console.log('Public WebSocket connection:', socket.id);
      // Handle public streams/events
    }
  });
  
  io.on(STREAM_EVENTS.DISCONNECT, (socket: Socket) => {
    console.log('Client disconnected:', socket.id);
  });
  
  io.on(STREAM_EVENTS.GENERATE_DAILY_QUEST, async (socket: Socket) => {
    console.log('quest_of_the_day error:', socket.id);
    try {
      await generatePersonalizedQuest(socket);
    } catch (err) {
      console.error('Error in global quest generation:', err);
      try {
        await generateDailyQuest(socket);
      } catch (fallbackErr) {
        console.error('Fallback quest generation also failed:', fallbackErr);
      }
    }
  }); 
};
