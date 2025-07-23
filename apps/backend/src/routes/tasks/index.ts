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

const BreakMetadataSchema = z.object({
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
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    // schema: {
    //   body: TaskSchema,
    // },
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

  fastify.get('/', {
    onRequest: [fastify.authenticate],
    // schema: {
    //   querystring: z.object({
    //     completed: z.string().optional(),
    //     priority: z.string().optional(),
    //     category: z.string().optional(),
    //   }),
    // },
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

  fastify.get('/:id', {
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

  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    // schema: {
    //   body: TaskSchema.partial(),
    // },
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

  fastify.delete('/:id', {
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





  // Statistics routes
  fastify.get('/stats', {
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

export default focusRoutes;