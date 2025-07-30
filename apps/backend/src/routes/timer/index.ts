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
  duration: z.number().min(0).optional(), // Allow 0 for sessions that haven't started yet
  activities: z.array(z.string()).optional(),
  persons: z.array(z.string()).optional(),
  location: z.string().optional(),
  weather: z.string().optional(),
  mood: z.string().optional(),
  energyLevel: z.string().optional(),
  productivityLevel: z.string().optional(),
  metadata: z.any().optional(),
}).partial();

async function timerRoutes(fastify: FastifyInstance) {

  // Debug endpoint to check user authentication
  fastify.get('/debug/user', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });
      
      return reply.send({ 
        success: true, 
        data: {
          jwtUserId: userId,
          userExists: !!user,
          user: user ? {
            id: user.id,
            userAddress: user.userAddress,
            email: user.email
          } : null
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

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
      
      // Verify user exists in database
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found in database' });
      }

      const body = TimerSessionSchema.safeParse(request.body);
      if (!body.success) {
        console.log("Validation error:", body.error);
        return reply.code(400).send({ 
          error: 'Invalid session data', 
          details: body.error.issues 
        });
      }

      const sessionData = request.body as z.infer<typeof TimerSessionSchema>;

      // Log the received data for debugging
      console.log("Received timer session data:", JSON.stringify(sessionData, null, 2));

      // Clean up "undefined" string values and empty strings
      const cleanSessionData = {
        ...sessionData,
        taskId: (sessionData.taskId === "undefined" || sessionData.taskId === "") ? undefined : sessionData.taskId,
        goalId: (sessionData.goalId === "undefined" || sessionData.goalId === "") ? undefined : sessionData.goalId,
        location: (sessionData.location === "undefined" || sessionData.location === "") ? undefined : sessionData.location,
        weather: (sessionData.weather === "undefined" || sessionData.weather === "") ? undefined : sessionData.weather,
        mood: (sessionData.mood === "undefined" || sessionData.mood === "") ? undefined : sessionData.mood,
        energyLevel: (sessionData.energyLevel === "undefined" || sessionData.energyLevel === "") ? undefined : sessionData.energyLevel,
        productivityLevel: (sessionData.productivityLevel === "undefined" || sessionData.productivityLevel === "") ? undefined : sessionData.productivityLevel,
      };

      // Log the cleaned data for debugging
      console.log("Cleaned timer session data:", JSON.stringify(cleanSessionData, null, 2));

      // Validate taskId exists if provided
      if (cleanSessionData.taskId) {
        const task = await fastify.prisma.task.findFirst({
          where: { id: cleanSessionData.taskId, userId }
        });
        if (!task) {
          return reply.code(400).send({ error: 'Task not found or does not belong to user' });
        }
      }

      // Validate goalId exists if provided
      if (cleanSessionData.goalId) {
        const goal = await fastify.prisma.goal.findFirst({
          where: { id: cleanSessionData.goalId, userId }
        });
        if (!goal) {
          return reply.code(400).send({ error: 'Goal not found or does not belong to user' });
        }
      }

      const data: any = {
        userId,
        type: cleanSessionData.type || 'focus', // Default to 'focus' if not provided
        startTime: cleanSessionData?.startTime ? new Date(cleanSessionData.startTime) : new Date(),
        endTime: cleanSessionData.endTime ? new Date(cleanSessionData.endTime) : null,
        duration: cleanSessionData.duration || 0,
        note: cleanSessionData.notes, // Map notes to note field in database
        completed: cleanSessionData.completed !== undefined ? cleanSessionData.completed : false,
        // Only add these if they are defined and validated
        ...(cleanSessionData.taskId ? { taskId: cleanSessionData.taskId } : {}),
        ...(cleanSessionData.goalId ? { goalId: cleanSessionData.goalId } : {}),
        // Add optional fields if provided
        activities: cleanSessionData.activities || [],
        persons: cleanSessionData.persons || [],
        ...(cleanSessionData.location ? { location: cleanSessionData.location } : {}),
        ...(cleanSessionData.weather ? { weather: cleanSessionData.weather } : {}),
        ...(cleanSessionData.mood ? { mood: cleanSessionData.mood } : {}),
        ...(cleanSessionData.energyLevel ? { energyLevel: cleanSessionData.energyLevel } : {}),
        ...(cleanSessionData.productivityLevel ? { productivityLevel: cleanSessionData.productivityLevel } : {}),
        ...(cleanSessionData.metadata ? { metadata: cleanSessionData.metadata } : {}),
      };

      const session = await fastify.prisma.timerSession.create({ data });

      return reply.code(201).send({ success: true, data: session });
    } catch (error) {
      request.log.error(error);
      
      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        return reply.code(400).send({ 
          error: 'Foreign key constraint violation',
          message: 'The referenced task or goal does not exist'
        });
      }
      
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
      
      // Verify user exists in database
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found in database' });
      }
      
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
      
      // Verify user exists in database
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found in database' });
      }
      
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

      const updateData = body.data as Partial<z.infer<typeof TimerSessionSchema>>;
      const data: any = {
        ...updateData,
        startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
        endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
        note: updateData.notes, // Map notes to note field
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
      
      // Verify user exists in database
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found in database' });
      }
      
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
      
      // Verify user exists in database
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found in database' });
      }
      
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