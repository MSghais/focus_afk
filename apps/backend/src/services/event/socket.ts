import { Server, Socket } from 'socket.io';
import { streamEvents, STREAM_EVENTS } from './index';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateDailyQuest, generatePersonalizedQuest, generateTailoredQuests } from './generate_quest';
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
              // TODO
              // await generatePersonalizedQuest(socket);
              await generateDailyQuest(socket);

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
              // await generatePersonalizedQuest(socket);
              await generateDailyQuest(socket);

            } catch (err) {
              console.error('Error in manual quest generation:', err);
              // Fallback to basic quest
              try {
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

          // Add handler for goal-based task suggestion quests
          socket.on('request_goal_task_suggestions', async () => {
            try {
              const userId = socket.data.user?.id;
              // const userAddress = socket.data.user?.userAddress;
              
              if (userId ) {
                const goalTaskQuests = await enhancedQuestService.generateGoalBasedTaskSuggestions(userId,);
                socket.emit('goal_task_suggestions_response', {
                  quests: goalTaskQuests,
                  message: 'Goal-based task suggestions generated successfully'
                });
              }
            } catch (error) {
              console.error('Error generating goal-based task suggestions:', error);
              socket.emit('goal_task_suggestions_response', {
                quests: [],
                message: 'Failed to generate goal-based task suggestions',
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
