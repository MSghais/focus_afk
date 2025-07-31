import { FastifyInstance } from "fastify";
import { PrismaClient, User } from "@prisma/client";
import { EnhancedQuestService } from "../../services/enhancedQuestService";
import { EnhancedGamificationService } from "../../services/enhancedGamificationService";
import { PineconeService } from "../../ai/memory/pinecone.service";
import { EnhancedContextManager } from "../../ai/memory/enhancedContextManager";
import { GamificationService } from "../../services/gamification.service";
import { MemoryManager } from "../../ai/memory/memoryManager";

export default async function enhancedQuestsRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma as PrismaClient;
  
  // Initialize services
  const pineconeService = new PineconeService(prisma);
  const memoryManager = new MemoryManager(prisma);
  const enhancedContextManager = new EnhancedContextManager(prisma, pineconeService, memoryManager);
  const gamificationService = new GamificationService(
    prisma,
    process.env.BLOCKCHAIN_RPC_URL || '',
    process.env.BLOCKCHAIN_PRIVATE_KEY || '',
    process.env.FOCUS_TOKEN_ADDRESS || '',
    process.env.QUEST_NFT_ADDRESS || '',
    process.env.FOCUS_SBT_ADDRESS || ''
  );
  
  const questService = new EnhancedQuestService(
    prisma,
    pineconeService,
    enhancedContextManager,
    gamificationService
  );
  
  const enhancedGamificationService = new EnhancedGamificationService(
    prisma,
    questService,
    pineconeService,
    enhancedContextManager,
    process.env.RPC_URL || '',
    process.env.PRIVATE_KEY || '',
    process.env.FOCUS_TOKEN_ADDRESS || '',
    process.env.QUEST_NFT_ADDRESS || '',
    process.env.FOCUS_SBT_ADDRESS || ''
  );

  // Get user's quests with enhanced context
  fastify.get('/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string | undefined };
      

      const user = request.user as User;

      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized'
        });
      }

      if(!userId || user.id !== userId) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Get user's active quests
      const activeQuests = await prisma.quests.findMany({
        where: {
          userId: user.id,
          isCompleted: 'false'
        },
        orderBy: [
          { type: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      // Get user's completed quests
      const completedQuests = await prisma.quests.findMany({
        where: {
          userId,
          isCompleted: 'true'
        },
        orderBy: { dateAwarded: 'desc' },
        take: 10
      });

      // Get user's gamification stats
      const userStats = await enhancedGamificationService.getUserStats(userId);

      return {
        success: true,
        data: {
          activeQuests,
          completedQuests,
          userStats
        }
      };
    } catch (error) {
      console.error('Error fetching user quests:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch user quests'
      });
    }
  });

  // Generate new quests for user
  fastify.post('/generate/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      // Get user to get their address
      const user = request.user as User;

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      if(!userId || user.id !== userId) {

        return reply.status(401).send({
          success: false,
          error: 'Unauthorized'
        });
      }

        // Generate new quests
      const generatedQuests = await questService.generateQuestsForUser(userId, user.userAddress);

      return {
        success: true,
        data: {
          generatedQuests,
          message: `Generated ${generatedQuests.length} new quests`
        }
      };
    } catch (error) {
      console.error('Error generating quests:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate quests'
      });
    }
  });

  // Complete a quest
  fastify.post('/complete/:questId', async (request, reply) => {
    try {
      const { questId } = request.params as { questId: string };
      const { userId, userAddress } = request.body as { userId: string; userAddress: string };

      const user = request.user as User;

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'   
        });
      }

      if(!userId || user.id !== userId) {

        return reply.status(401).send({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Get the quest
      const quest = await prisma.quests.findUnique({
        where: { id: questId },
        include: { user: true }
      });

      if (!quest) {
        return reply.status(404).send({
          success: false,
          error: 'Quest not found'
        });
      }

      if (quest.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Unauthorized'
        });
      }

      if (quest.isCompleted === 'true') {
        return reply.status(400).send({
          success: false,
          error: 'Quest already completed'
        });
      }

      // Process quest completion event
      await enhancedGamificationService.processEvent({
        type: 'quest_completed',
        userId,
        userAddress,
        data: {
          questId,
          questName: quest.name,
          questDescription: quest.description,
          rewardXp: quest.rewardXp,
          rewardTokens: quest.rewardTokens || 0,
          difficulty: quest.difficulty
        },
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          message: 'Quest completed successfully',
          questId,
          rewards: {
            xp: quest.rewardXp,
            tokens: quest.rewardTokens || 0
          }
        }
      };
    } catch (error) {
      console.error('Error completing quest:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to complete quest'
      });
    }
  });

  // Update quest progress
  fastify.post('/update-progress/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      await questService.updateQuestProgress(userId);

      return {
        success: true,
        data: {
          message: 'Quest progress updated successfully'
        }
      };
    } catch (error) {
      console.error('Error updating quest progress:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update quest progress'
      });
    }
  });

  // Get quest templates
  fastify.get('/templates', async (request, reply) => {
    try {
      // This would return available quest templates
      // For now, return a basic structure
      const templates = [
        {
          id: 'daily_focus_30',
          name: 'Daily Focus',
          description: 'Complete 30 minutes of focused work today',
          type: 'daily',
          category: 'focus',
          difficulty: 1,
          rewardXp: 100,
          rewardTokens: 10
        },
        {
          id: 'daily_tasks_3',
          name: 'Task Master',
          description: 'Complete 3 tasks today',
          type: 'daily',
          category: 'tasks',
          difficulty: 2,
          rewardXp: 150,
          rewardTokens: 15
        },
        {
          id: 'weekly_focus_300',
          name: 'Focus Warrior',
          description: 'Complete 5 hours of focused work this week',
          type: 'weekly',
          category: 'focus',
          difficulty: 3,
          rewardXp: 500,
          rewardTokens: 50
        }
      ];

      return {
        success: true,
        data: templates
      };
    } catch (error) {
      console.error('Error fetching quest templates:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch quest templates'
      });
    }
  });

  // Get user gamification stats
  fastify.get('/stats/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      const userStats = await enhancedGamificationService.getUserStats(userId);
      
      if (!userStats) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      return {
        success: true,
        data: userStats
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch user stats'
      });
    }
  });

  // Get leaderboard
  fastify.get('/leaderboard', async (request, reply) => {
    try {
      const { limit = 10 } = request.query as { limit?: number };
      
      const leaderboard = await enhancedGamificationService.getLeaderboard(limit);

      return {
        success: true,
        data: leaderboard
      };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch leaderboard'
      });
    }
  });

  // Get next level progress
  fastify.get('/level-progress/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      const levelProgress = await enhancedGamificationService.getNextLevelProgress(userId);
      
      if (!levelProgress) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      return {
        success: true,
        data: levelProgress
      };
    } catch (error) {
      console.error('Error fetching level progress:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch level progress'
      });
    }
  });

  // Process gamification event
  fastify.post('/event', async (request, reply) => {
    try {
      const event = request.body as any;
      
      await enhancedGamificationService.processEvent(event);

      return {
        success: true,
        data: {
          message: 'Event processed successfully'
        }
      };
    } catch (error) {
      console.error('Error processing event:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to process event'
      });
    }
  });

  // Get quest analytics
  fastify.get('/analytics/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      // Get quest completion statistics
      const questStats = await prisma.quests.groupBy({
        by: ['type', 'isCompleted'],
        where: { userId },
        _count: {
          id: true
        }
      });

      // Get quest completion over time
      const questTimeline = await prisma.quests.findMany({
        where: {
          userId,
          isCompleted: 'true'
        },
        select: {
          dateAwarded: true,
          type: true,
          rewardXp: true
        },
        orderBy: { dateAwarded: 'desc' },
        take: 30
      });

      // Calculate completion rates
      const totalQuests = questStats.reduce((sum, stat) => sum + stat._count.id, 0);
      const completedQuests = questStats
        .filter(stat => stat.isCompleted === 'true')
        .reduce((sum, stat) => sum + stat._count.id, 0);
      
      const completionRate = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

      return {
        success: true,
        data: {
          questStats,
          questTimeline,
          completionRate,
          totalQuests,
          completedQuests
        }
      };
    } catch (error) {
      console.error('Error fetching quest analytics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch quest analytics'
      });
    }
  });

  // Create generic quest
  fastify.post('/create-generic', async (request, reply) => {
    try {
      const questData = request.body as {
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
      };

      const quest = await questService.createGenericQuest({
        ...questData,
        expiresAt: questData.expiresAt ? new Date(questData.expiresAt) : undefined
      });

      return {
        success: true,
        data: {
          quest,
          message: 'Generic quest created successfully'
        }
      };
    } catch (error) {
      console.error('Error creating generic quest:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create generic quest'
      });
    }
  });

  // Create suggestion quest
  fastify.post('/create-suggestion', async (request, reply) => {
    try {
      const questData = request.body as {
        userId: string;
        userAddress: string;
        suggestionType: 'productivity' | 'wellness' | 'learning' | 'social' | 'custom';
        context: any[];
        aiReasoning: string;
        difficulty?: 1 | 2 | 3 | 4 | 5;
        expiresAt?: string;
      };

      const quest = await questService.createSuggestionQuest({
        ...questData,
        expiresAt: questData.expiresAt ? new Date(questData.expiresAt) : undefined
      });

      return {
        success: true,
        data: {
          quest,
          message: 'Suggestion quest created successfully'
        }
      };
    } catch (error) {
      console.error('Error creating suggestion quest:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create suggestion quest'
      });
    }
  });

  // Send connection quests
  fastify.post('/connection-quests/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { userAddress } = request.body as { userAddress: string };

      const quests = await questService.sendConnectionQuests(userId, userAddress);

      return {
        success: true,
        data: {
          quests,
          message: `Sent ${quests.length} connection quests`
        }
      };
    } catch (error) {
      console.error('Error sending connection quests:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to send connection quests'
      });
    }
  });

  // Send contextual quests
  fastify.post('/contextual-quests/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { userAddress, triggerPoint } = request.body as {
        userAddress: string;
        triggerPoint: 'task_completion' | 'goal_progress' | 'focus_session' | 'note_creation' | 'streak_milestone' | 'level_up' | 'idle_detection';
      };

      const quests = await questService.sendContextualQuests(userId, userAddress, triggerPoint);

      return {
        success: true,
        data: {
          quests,
          message: `Sent ${quests.length} contextual quests for ${triggerPoint}`
        }
      };
    } catch (error) {
      console.error('Error sending contextual quests:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to send contextual quests'
      });
    }
  });

  // Get quest suggestions based on user context
  fastify.get('/suggestions/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { limit = 5 } = request.query as { limit?: number };

      // Get user context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          tasks: { take: 10 },
          goals: { take: 10 },
          notes: { take: 10 },
          timerSessions: { take: 10 }
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Generate suggestions based on user data
      const suggestions = await questService.generateQuestSuggestions(user, limit);

      return {
        success: true,
        data: {
          suggestions,
          message: `Generated ${suggestions.length} quest suggestions`
        }
      };
    } catch (error) {
      console.error('Error generating quest suggestions:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate quest suggestions'
      });
    }
  });

  // Get quest templates for different types
  fastify.get('/templates/:type', async (request, reply) => {
    try {
      const { type } = request.params as { type: string };
      const { category, difficulty } = request.query as { category?: string; difficulty?: string };

      const templates = await questService.getQuestTemplates(type, {
        category: category as any,
        difficulty: difficulty ? parseInt(difficulty) as any : undefined
      });

      return {
        success: true,
        data: templates
      };
    } catch (error) {
      console.error('Error fetching quest templates:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch quest templates'
      });
    }
  });

  // Bulk create quests
  fastify.post('/bulk-create', async (request, reply) => {
    try {
      const { userId, userAddress, quests } = request.body as {
        userId: string;
        userAddress: string;
        quests: Array<{
          type: 'generic' | 'suggestion';
          data: any;
        }>;
      };

      const createdQuests = [];

      for (const questRequest of quests) {
        try {
          let quest;
          if (questRequest.type === 'generic') {
            quest = await questService.createGenericQuest({
              userId,
              userAddress,
              ...questRequest.data
            });
          } else if (questRequest.type === 'suggestion') {
            quest = await questService.createSuggestionQuest({
              userId,
              userAddress,
              ...questRequest.data
            });
          }
          if (quest) createdQuests.push(quest);
        } catch (error) {
          console.error(`Error creating quest of type ${questRequest.type}:`, error);
        }
      }

      return {
        success: true,
        data: {
          quests: createdQuests,
          message: `Created ${createdQuests.length} out of ${quests.length} quests`
        }
      };
    } catch (error) {
      console.error('Error bulk creating quests:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to bulk create quests'
      });
    }
  });

  // Generate priority quest suggestions at connection
  fastify.post('/priority-suggestions/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { userAddress } = request.body as { userAddress: string };

      const quests = await questService.generatePriorityQuestSuggestions(userId, userAddress);

      return {
        success: true,
        data: {
          quests,
          message: `Generated ${quests.length} priority-based quest suggestions`,
          hasTaskData: quests.some(q => q.type === 'priority'),
          questTypes: quests.map(q => q.type)
        }
      };
    } catch (error) {
      console.error('Error generating priority quest suggestions:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate priority quest suggestions'
      });
    }
  });

  // Get user task summary for quest generation
  fastify.get('/task-summary/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      const tasks = await prisma.task.findMany({
        where: {
          userId,
          completed: false
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        take: 10,
        select: {
          id: true,
          title: true,
          priority: true,
          dueDate: true,
          createdAt: true
        }
      });

      const taskSummary = {
        totalTasks: tasks.length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
        mediumPriority: tasks.filter(t => t.priority === 'medium').length,
        lowPriority: tasks.filter(t => t.priority === 'low').length,
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
        recentTasks: tasks.slice(0, 5)
      };

      return {
        success: true,
        data: taskSummary
      };
    } catch (error) {
      console.error('Error fetching task summary:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch task summary'
      });
    }
  });
} 