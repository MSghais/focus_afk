import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();


const UserSettingsSchema = z.object({
  defaultFocusDuration: z.number().positive(),
  defaultBreakDuration: z.number().positive(),
  autoStartBreaks: z.boolean(),
  autoStartSessions: z.boolean(),
  notifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'auto']),
});

async function profileRoutes(fastify: FastifyInstance) {




  // User settings routes
  fastify.get('/settings', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      let settings = await fastify.prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        // Create default settings
        settings = await fastify.prisma.userSettings.create({
          data: {
            userId,
            defaultFocusDuration: 25,
            defaultBreakDuration: 5,
            autoStartBreaks: false,
            autoStartSessions: false,
            notifications: true,
            theme: 'auto',
          },
        });
      }

      return reply.send({ success: true, data: settings });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.put('/settings', {
    onRequest: [fastify.authenticate],
    // schema: {
    //   body: UserSettingsSchema.partial(),
    // },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const updateData = request.body as Partial<z.infer<typeof UserSettingsSchema>>;

      const settings = await fastify.prisma.userSettings.upsert({
        where: { userId },
        update: {
          ...updateData,
          updatedAt: new Date(),
        },
        create: {
          userId,
          ...updateData,
        },
      });

      return reply.send({ success: true, data: settings });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Statistics routes
  fastify.get('/stats/tasks', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const now = new Date();

      const tasks = await fastify.prisma.task.findMany({
        where: { userId },
      });

      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        pending: tasks.filter(t => !t.completed && (!t.dueDate || t.dueDate > now)).length,
        overdue: tasks.filter(t => !t.completed && t.dueDate && t.dueDate < now).length,
      };

      return reply.send({ success: true, data: stats });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

}

export default profileRoutes;