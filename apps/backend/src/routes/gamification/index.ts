import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
dotenv.config();

async function gamificationRoutes(fastify: FastifyInstance) {
  // Health check for gamification service
  fastify.get('/health',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        if (!fastify.gamificationService) {
          return reply.status(503).send({
            success: false,
            error: 'Gamification service not available',
            message: 'Service not initialized - check blockchain configuration'
          });
        }

        const health = await fastify.gamificationService.checkServiceHealth();
        
        return reply.status(200).send({
          success: true,
          health,
          message: health.isHealthy ? 'Gamification service is healthy' : 'Gamification service has issues'
        });
      } catch (error) {
        console.error("Error checking gamification health", error);
        return reply.status(500).send({
          success: false,
          error: 'Error checking service health'
        });
      }
    });

  // Get user's gamification stats
  fastify.get('/user/:userId/stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id as string;
        const user = await fastify.prisma.user.findUnique({
          where: { id: userId },
          include: {
            timerSessions: true,
            tasks: true,
            goals: true,
            badges: true,
            quests: true
          }
        });

        if (!user) {
          return reply.status(404).send({ success: false, error: 'User not found' });
        }

        // Calculate stats
        const totalFocusMinutes = user.timerSessions
          .filter(s => s.type === 'focus')
          .reduce((sum, s) => sum + s.duration / 60, 0);

        const totalDeepMinutes = user.timerSessions
          .filter(s => s.type === 'deep')
          .reduce((sum, s) => sum + s.duration / 60, 0);

        const completedTasks = user.tasks.filter(t => t.completed).length;
        const completedGoals = user.goals.filter(g => g.completed).length;
        const completedQuests = user.quests.filter(q => q.isCompleted === 'true').length;
        const unlockedBadges = user.badges.length;

        // Calculate level based on total XP (simplified)
        const totalXp = totalFocusMinutes * 10 + totalDeepMinutes * 20 + completedTasks * 50 + completedGoals * 100;
        const level = Math.floor(totalXp / 1000) + 1;

        const stats = {
          level,
          totalXp,
          totalFocusMinutes,
          totalDeepMinutes,
          completedTasks,
          completedGoals,
          completedQuests,
          unlockedBadges,
          soulboundToken: user.soulboundToken,
          longestStreak: 0, // TODO: Calculate from timer sessions
          currentStreak: 0  // TODO: Calculate from timer sessions
        };

        return reply.status(200).send({ success: true, stats });
      } catch (error) {
        console.error("Error getting gamification stats", error);
        return reply.status(500).send({ success: false, error: 'Error getting stats' });
      }
    });

  // Update focus stats (called after timer session completion)
  fastify.post('/user/:userId/focus-stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id as string;
        const { sessionMinutes, streak } = request.body as { sessionMinutes: number; streak: number };
        
        const user = await fastify.prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          return reply.status(404).send({ success: false, error: 'User not found' });
        }

        if (fastify.gamificationService) {
          await fastify.gamificationService.updateFocusStats(user.userAddress, sessionMinutes, streak);
        }

        return reply.status(200).send({ 
          success: true, 
          message: 'Focus stats updated successfully' 
        });
      } catch (error) {
        console.error("Error updating focus stats", error);
        return reply.status(500).send({ 
          success: false, 
          error: 'Error updating focus stats' 
        });
      }
    });

  // Get user's badges
  fastify.get('/user/:userId/badges',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id as string;
        const badges = await fastify.prisma.badge.findMany({
          where: { userId },
          orderBy: { dateAwarded: 'desc' }
        });

        return reply.status(200).send({ success: true, badges });
      } catch (error) {
        console.error("Error getting badges", error);
        return reply.status(500).send({ success: false, error: 'Error getting badges' });
      }
    });

  // Get user's token balance (if connected to blockchain)
  fastify.get('/user/:userId/token-balance',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id as string;
        const user = await fastify.prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          return reply.status(404).send({ success: false, error: 'User not found' });
        }

        // TODO: Implement actual token balance checking from blockchain
        // For now, return mock data
        const balance = {
          focusTokens: 0,
          questNFTs: 0,
          soulboundToken: user.soulboundToken
        };

        return reply.status(200).send({ success: true, balance });
      } catch (error) {
        console.error("Error getting token balance", error);
        return reply.status(500).send({ success: false, error: 'Error getting token balance' });
      }
    });
}

export default gamificationRoutes;
