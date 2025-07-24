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
          return { success: false, error: 'User not found' };
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
        return { success: true, quests };
      } catch (error) {
        console.error("Error getting quests", error);
        return { success: false, error: 'Error getting quests' };
      }
    });


}

export default questsRoutes;
