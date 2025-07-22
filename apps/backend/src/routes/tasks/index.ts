import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

// Validation schemas
const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedMinutes: z.number().positive().optional(),
});

const GoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().datetime().optional(),
  category: z.string().optional(),
  relatedTaskIds: z.array(z.string()).optional(),
});

const TimerSessionSchema = z.object({
  taskId: z.string().optional(),
  goalId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().positive(),
  notes: z.string().optional(),
});

const TimerBreakSessionSchema = TimerSessionSchema.extend({
  isHavingFun: z.boolean().optional(),
  activities: z.array(z.string()).optional(),
  persons: z.array(z.string()).optional(),
  location: z.string().optional(),
  weather: z.string().optional(),
  mood: z.string().optional(),
  energyLevel: z.string().optional(),
  productivityLevel: z.string().optional(),
});

const UserSettingsSchema = z.object({
  defaultFocusDuration: z.number().positive(),
  defaultBreakDuration: z.number().positive(),
  autoStartBreaks: z.boolean(),
  autoStartSessions: z.boolean(),
  notifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'auto']),
});

async function focusRoutes(fastify: FastifyInstance) {
  // Task routes
  fastify.post('/tasks', {
    onRequest: [fastify.authenticate],
    schema: {
      body: TaskSchema,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const taskData = request.body as z.infer<typeof TaskSchema>;

      const task = await fastify.prisma.task.create({
        data: {
          ...taskData,
          userId,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        },
      });

      return reply.code(201).send({ success: true, data: task });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/tasks', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: z.object({
        completed: z.string().optional(),
        priority: z.string().optional(),
        category: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { completed, priority, category } = request.query as any;

      const where: any = { userId };
      if (completed !== undefined) where.completed = completed === 'true';
      if (priority) where.priority = priority;
      if (category) where.category = category;

      const tasks = await fastify.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, data: tasks });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/tasks/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { id } = request.params as { id: string };

      const task = await fastify.prisma.task.findFirst({
        where: { id, userId },
      });

      if (!task) {
        return reply.code(404).send({ error: 'Task not found' });
      }

      return reply.send({ success: true, data: task });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.put('/tasks/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      body: TaskSchema.partial(),
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { id } = request.params as { id: string };
      const updateData = request.body as Partial<z.infer<typeof TaskSchema>>;

      const task = await fastify.prisma.task.findFirst({
        where: { id, userId },
      });

      if (!task) {
        return reply.code(404).send({ error: 'Task not found' });
      }

      const updatedTask = await fastify.prisma.task.update({
        where: { id },
        data: {
          ...updateData,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          updatedAt: new Date(),
        },
      });

      return reply.send({ success: true, data: updatedTask });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.delete('/tasks/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { id } = request.params as { id: string };

      const task = await fastify.prisma.task.findFirst({
        where: { id, userId },
      });

      if (!task) {
        return reply.code(404).send({ error: 'Task not found' });
      }

      await fastify.prisma.task.delete({
        where: { id },
      });

      return reply.send({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Goal routes
  fastify.post('/goals', {
    onRequest: [fastify.authenticate],
    schema: {
      body: GoalSchema,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const goalData = request.body as z.infer<typeof GoalSchema>;

      const goal = await fastify.prisma.goal.create({
        data: {
          ...goalData,
          userId,
          targetDate: goalData.targetDate ? new Date(goalData.targetDate) : null,
        },
      });

      return reply.code(201).send({ success: true, data: goal });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/goals', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: z.object({
        completed: z.string().optional(),
        category: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { completed, category } = request.query as any;

      const where: any = { userId };
      if (completed !== undefined) where.completed = completed === 'true';
      if (category) where.category = category;

      const goals = await fastify.prisma.goal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, data: goals });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.put('/goals/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      body: GoalSchema.partial(),
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { id } = request.params as { id: string };
      const updateData = request.body as Partial<z.infer<typeof GoalSchema>>;

      const goal = await fastify.prisma.goal.findFirst({
        where: { id, userId },
      });

      if (!goal) {
        return reply.code(404).send({ error: 'Goal not found' });
      }

      const updatedGoal = await fastify.prisma.goal.update({
        where: { id },
        data: {
          ...updateData,
          targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined,
          updatedAt: new Date(),
        },
      });

      return reply.send({ success: true, data: updatedGoal });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Timer session routes
  fastify.post('/timer-sessions', {
    onRequest: [fastify.authenticate],
    schema: {
      body: TimerSessionSchema,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const sessionData = request.body as z.infer<typeof TimerSessionSchema>;

      const session = await fastify.prisma.timerSession.create({
        data: {
          ...sessionData,
          userId,
          startTime: new Date(sessionData.startTime),
          endTime: sessionData.endTime ? new Date(sessionData.endTime) : null,
        },
      });

      return reply.code(201).send({ success: true, data: session });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/timer-sessions', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: z.object({
        taskId: z.string().optional(),
        goalId: z.string().optional(),
        completed: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { taskId, goalId, completed, startDate, endDate } = request.query as any;

      const where: any = { userId };
      if (taskId) where.taskId = taskId;
      if (goalId) where.goalId = goalId;
      if (completed !== undefined) where.completed = completed === 'true';
      if (startDate) where.startTime = { gte: new Date(startDate) };
      if (endDate) where.startTime = { ...where.startTime, lte: new Date(endDate) };

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

  // Timer break session routes
  fastify.post('/timer-break-sessions', {
    onRequest: [fastify.authenticate],
    schema: {
      body: TimerBreakSessionSchema,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const sessionData = request.body as z.infer<typeof TimerBreakSessionSchema>;

      const session = await fastify.prisma.timerBreakSession.create({
        data: {
          ...sessionData,
          userId,
          startTime: new Date(sessionData.startTime),
          endTime: sessionData.endTime ? new Date(sessionData.endTime) : null,
        },
      });

      return reply.code(201).send({ success: true, data: session });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

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
    schema: {
      body: UserSettingsSchema.partial(),
    },
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

  fastify.get('/stats/focus', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: z.object({
        days: z.string().optional(),
      }),
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

export default focusRoutes;