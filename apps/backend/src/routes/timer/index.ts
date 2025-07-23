import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import dotenv from 'dotenv';
// import { zodToJsonSchema } from 'zod-to-json-schema';
dotenv.config();

const TimerSessionSchema = z.object({
  taskId: z.string().optional(),
  userId: z.string().optional(),
  completed: z.boolean().optional(),
  notes: z.string().optional(),
  type: z.enum(['focus', 'break', 'deep']).optional(),
  goalId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().positive().optional(),
}).partial();

async function timerRoutes(fastify: FastifyInstance) {

  // Timer session routes
  // Fix: Fastify v5+ requires JSON schema, not Zod schema, in the route definition.
  // Use zodToJsonSchema to convert the Zod schema to JSON schema for Fastify.
  // Fix: Use zodToJsonSchema for the body schema, and ensure only valid JSON Schema keywords are used.
  fastify.post('/timer-sessions', {
    onRequest: [fastify.authenticate],
    schema: {
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }, // You can further specify the timerSession shape if desired
          },
          required: ['success', 'data'],
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      // const sessionData = request.body as z.infer<typeof TimerSessionSchema>;

        const body = TimerSessionSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: 'Invalid session data' });
      }

      const sessionData = request.body as z.infer<typeof TimerSessionSchema>;

      const data: any = {
        userId,
        startTime: sessionData?.startTime ? new Date(sessionData.startTime) : new Date(),
        endTime: sessionData.endTime ? new Date(sessionData.endTime) : null,
        duration: sessionData.duration,
        notes: sessionData.notes,
        // Only add these if they are defined
        ...(sessionData.taskId ? { taskId: sessionData.taskId } : {}),
        ...(sessionData.goalId ? { goalId: sessionData.goalId } : {}),
        ...(sessionData.completed !== undefined ? { completed: sessionData.completed } : {}),
        ...(sessionData.type ? { type: sessionData.type } : {}),
      };

      const session = await fastify.prisma.timerSession.create({ data });

      return reply.code(201).send({ success: true, data: session });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/timer-sessions', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          goalId: { type: 'string' },
          completed: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
        additionalProperties: false,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } }, // You can further specify the timerSession shape if desired
          },
          required: ['success', 'data'],
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { taskId, goalId, completed, startDate, endDate } = request.query as {
        taskId?: string;
        goalId?: string;
        completed?: string;
        startDate?: string;
        endDate?: string;
      };

      const where: any = { userId };
      if (taskId) where.taskId = taskId;
      if (goalId) where.goalId = goalId;
      if (completed !== undefined) where.completed = completed === 'true';
      if (startDate) where.startTime = { gte: new Date(startDate) };
      if (endDate) where.startTime = { ...(where.startTime || {}), lte: new Date(endDate) };

      const sessions = await fastify.prisma.timerSession.findMany({
        where,
        orderBy: { startTime: 'desc' },
      });

      return reply.send({ success: true, data: sessions });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update a timer session
  fastify.put('/timer-sessions/:id', {
    onRequest: [fastify.authenticate],
    preValidation: [
      (request, reply, done) => {
        const body = TimerSessionSchema.safeParse(request.body);
        if (!body.success) {
          return reply.code(400).send({ error: 'Invalid session data' });
        }
        done();
      },
    ],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { id } = request.params as { id: string };
      const body = TimerSessionSchema.safeParse(request.body);  
      if (!body.success) {
        return reply.code(400).send({ error: 'Invalid session data' });
      }

      const session = await fastify.prisma.timerSession.findFirst({
        where: { id, userId },
      });
      if (!session) {
        return reply.code(404).send({ error: 'Timer session not found' });
      }

      const updateData = body?.data as Partial<z.infer<typeof TimerSessionSchema>>;
      const data: any = {
        ...updateData,
        startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
        endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
      };
      // Only add these if they are defined
      if (updateData.taskId) data.taskId = updateData.taskId;
      if (updateData.goalId) data.goalId = updateData.goalId;

      const updatedSession = await fastify.prisma.timerSession.update({
        where: { id },
        data,
      });
      return reply.send({ success: true, data: updatedSession });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete a timer session
  fastify.delete('/timer-sessions/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { id } = request.params as { id: string };

      const session = await fastify.prisma.timerSession.findFirst({
        where: { id, userId },
      });
      if (!session) {
        return reply.code(404).send({ error: 'Timer session not found' });
      }

      await fastify.prisma.timerSession.delete({
        where: { id },
      });
      return reply.send({ success: true, message: 'Timer session deleted successfully' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });


  // // User settings routes
  // fastify.get('/settings', {
  //   onRequest: [fastify.authenticate],
  // }, async (request, reply) => {
  //   try {
  //     const userId = request.user.id;

  //     let settings = await fastify.prisma.userSettings.findUnique({
  //       where: { userId },
  //     });

  //     if (!settings) {
  //       // Create default settings
  //       settings = await fastify.prisma.userSettings.create({
  //         data: {
  //           userId,
  //           defaultFocusDuration: 25,
  //           defaultBreakDuration: 5,
  //           autoStartBreaks: false,
  //           autoStartSessions: false,
  //           notifications: true,
  //           theme: 'auto',
  //         },
  //       });
  //     }

  //     return reply.send({ success: true, data: settings });
  //   } catch (error) {
  //     request.log.error(error);
  //     return reply.code(500).send({ error: 'Internal server error' });
  //   }
  // });


  fastify.get('/stats/focus', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'string' }
        },
        additionalProperties: false
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const days = parseInt((request.query as any).days || '7');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sessions = await fastify.prisma.timerSession.findMany({
        where: {
          userId,
          completed: true,
          startTime: { gte: startDate },
        },
      });

      const totalMinutes = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
      const averageSessionLength = sessions.length > 0 ? totalMinutes / sessions.length : 0;

      // Group by day
      const sessionsByDay = sessions.reduce((acc, session) => {
        const date = session.startTime.toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.sessions++;
          existing.minutes += session.duration / 60;
        } else {
          acc.push({
            date: date!,
            sessions: 1,
            minutes: session.duration / 60,
          });
        }
        return acc;
      }, [] as { date: string; sessions: number; minutes: number }[]);

      const stats = {
        totalSessions: sessions.length,
        totalMinutes,
        averageSessionLength,
        sessionsByDay,
      };

      return reply.send({ success: true, data: stats });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

export default timerRoutes;