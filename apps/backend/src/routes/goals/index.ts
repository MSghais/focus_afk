import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

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


async function goalsRoutes(fastify: FastifyInstance) {
 
  // Goal routes
  fastify.post('/goals', {
    onRequest: [fastify.authenticate],
    // schema: {
    //   body: GoalSchema,
    // },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const body = GoalSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: 'Invalid goal data' });
      }
      
      const goalData = body.data as z.infer<typeof GoalSchema>; 

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
    // schema: {
    //   querystring: {
    //     type: 'object',
    //     properties: {
    //       completed: { type: 'string' },
    //       category: { type: 'string' },
    //     },
    //     additionalProperties: false,
    //   },
    // },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { completed, category } = request.query as {
        completed?: string;
        category?: string;
      };

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
    // schema: {
    //   body: GoalSchema.partial(),
    // },
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


}

export default goalsRoutes;