import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
dotenv.config();

async function questsRoutes(fastify: FastifyInstance) {
  // Get all quests for a user
  fastify.get('/user/:userId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id as string;
        if (!userId) {
          return reply.status(404).send({ success: false, error: 'User not found' });
        }

        // Update quest progress before returning
        if (fastify.gamificationService) {
          await fastify.gamificationService.updateQuestProgress(userId);
        }

        const quests = await fastify.prisma.quests.findMany({
          include: {
            user: true,
          },
          where: {
            userId,
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return reply.status(200).send({ success: true, quests });
      } catch (error) {
        console.error("Error getting quests", error);
        return reply.status(500).send({ success: false, error: 'Error getting quests' });
      }
    });

  // Get specific quest
  fastify.get('/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const quest = await fastify.prisma.quests.findUnique({
        include: {
          user: true,
        },
        where: {
          id: id,
        },
      });
      if (!quest) {
        return reply.status(404).send({ success: false, error: 'Quest not found' });
      }

      if (!quest.user) {
        return reply.status(404).send({ success: false, error: 'User not found' });
      }

      if (quest.user.id !== request.user?.id) {
        return reply.status(403).send({ success: false, error: 'User not authorized' });
      }
      return reply.status(200).send({ success: true, data: quest });
    });

  // Complete a quest
  fastify.post('/:id/complete',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id as string;
        const user = await fastify.prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          return reply.status(404).send({ success: false, error: 'User not found' });
        }

        if (!fastify.gamificationService) {
          return reply.status(500).send({ success: false, error: 'Gamification service not available' });
        }

        const completion = await fastify.gamificationService.completeQuest(id, userId, user.userAddress);
        
        return reply.status(200).send({ 
          success: true, 
          message: 'Quest completed successfully',
          completion 
        });
      } catch (error) {
        console.error("Error completing quest", error);
        return reply.status(500).send({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Error completing quest' 
        });
      }
    });

  // Generate new quests for user
  fastify.post('/generate',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id as string;
        
        if (!fastify.gamificationService) {
          return reply.status(500).send({ success: false, error: 'Gamification service not available' });
        }

        await fastify.gamificationService.generateQuestsForUser(userId);
        
        return reply.status(200).send({ 
          success: true, 
          message: 'Quests generated successfully' 
        });
      } catch (error) {
        console.error("Error generating quests", error);
        return reply.status(500).send({ 
          success: false, 
          error: 'Error generating quests' 
        });
      }
    });
}

export default questsRoutes;
