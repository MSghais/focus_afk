import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
dotenv.config();

async function questsRoutes(fastify: FastifyInstance) {
  // Get all quests for a user (stub)
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
        // TODO: Implement quest logic
        const quests = await fastify.prisma.quests.findMany({
          include: {
            user: true,
          },
          where: {
            userId,
          },
        });
        console.log("quests", quests);
        return reply.status(200).send({ success: true, quests });
      } catch (error) {
        console.error("Error getting quests", error);
        return reply.status(500).send({ success: false, error: 'Error getting quests' });
      }
    });

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
      return reply.status(200).send({ success: true, quest });
    });
}

export default questsRoutes;
