import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
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
    process.env.RPC_URL!,
    process.env.PRIVATE_KEY!,
    process.env.FOCUS_TOKEN_ADDRESS!,
    process.env.QUEST_NFT_ADDRESS!,
    process.env.FOCUS_SBT_ADDRESS!
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
    process.env.RPC_URL!,
    process.env.PRIVATE_KEY!,
    process.env.FOCUS_TOKEN_ADDRESS!,
    process.env.QUEST_NFT_ADDRESS!,
    process.env.FOCUS_SBT_ADDRESS!
  );

  // Get user's quests with enhanced context
  fastify.get('/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      // Get user's active quests
      const activeQuests = await prisma.quests.findMany({
        where: {
          userId,
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
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
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
          updatedAt: true,
          type: true,
          rewardXp: true
        },
        orderBy: { updatedAt: 'desc' },
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
} 