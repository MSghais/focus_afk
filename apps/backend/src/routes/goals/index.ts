import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import dotenv from 'dotenv';
import { AiService } from '../../services/ai/ai';
import { DEFAULT_MODEL, LLM_EXPENSIVE_MODELS_NAME, LLM_FREE_MODELS_NAME, LLM_LOW_COST_MODELS_NAME } from '../../config/models';
dotenv.config();

const GoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().datetime().optional(),
  category: z.string().optional(),
  relatedTaskIds: z.array(z.union([z.string(), z.number()])).optional(),
  completed: z.boolean().optional(),
  progress: z.number().optional(),
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

  const aiService = new AiService();
  // Goal routes
  fastify.post('/create', {
    onRequest: [fastify.authenticate],
    // schema: {
    //   body: GoalSchema,
    // },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const body = GoalSchema.safeParse(request.body);
      if (!body.success) {
        console.error('🔐 POST /goals/create - Invalid goal data:', body.error);
        return reply.code(400).send({ error: 'Invalid goal data' });
      }

      const goalData = body.data as z.infer<typeof GoalSchema>;

      // Verify user exists in database
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.error('🔐 POST /goals/create - User not found in database:', userId);
        return reply.code(404).send({ error: 'User not found' });
      }

      console.log('🔐 POST /goals/create - User found:', user.id, user.userAddress);

      // Convert relatedTaskIds to strings if they're numbers
      const relatedTaskIds = goalData.relatedTaskIds?.map(id => id.toString()) || [];

      const goal = await fastify.prisma.goal.create({
        data: {
          ...goalData,
          relatedTaskIds,
          userId,
          targetDate: goalData.targetDate ? new Date(goalData.targetDate) : null,
        },
      });

      console.log('🔐 POST /goals/create - Goal created successfully:', goal.id);
      return reply.code(201).send({ success: true, data: goal });
    } catch (error) {
      console.error('🔐 POST /goals/create - Error:', error);
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/', {
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

  fastify.get('/:id', {
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
      const { id } = request.params as { id: string };

      const where: any = { userId, id };


      const goal = await fastify.prisma.goal.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
      });

      if (!goal) {
        return reply.code(404).send({ error: 'Goal not found' });
      }

      if (goal.userId !== userId) {
        return reply.code(403).send({ error: 'You are not authorized to access this goal' });
      }

      return reply.send({ success: true, data: goal });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.put('/:id', {
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
        // Convert relatedTaskIds to strings if they're numbers
        const relatedTaskIds = updateData.relatedTaskIds?.map(id => id.toString()) || [];
        
        const goalUpserted = await fastify.prisma.goal.upsert({
          where: { id },
          update: {
            ...updateData,
            relatedTaskIds,
            user: {
              connect: {
                id: userId,
              },
            },
          },
          create: {
            title: updateData.title || '',
            description: updateData.description || '',
            category: updateData.category || '',
            relatedTaskIds,
            userId,
            targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        });
        return reply.send({ success: true, data: goalUpserted });
      }

      // Convert relatedTaskIds to strings if they're numbers
      const relatedTaskIds = updateData.relatedTaskIds?.map(id => id.toString()) || [];
      console.log("relatedTaskIds", relatedTaskIds);
      
      // Filter out fields that don't exist in the Prisma schema
      const { relatedTaskIds: _, ...prismaUpdateData } = updateData;
      
      const updatedGoal = await fastify.prisma.goal.update({
        where: { id },
        data: {
          ...prismaUpdateData,
          relatedTaskIds,
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

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {

    try {
      const userId = request.user.id;
      const { id } = request.params as { id: string };

      const goal = await fastify.prisma.goal.findFirst({
        where: { id, userId },
      });

      if (!goal) {
        return reply.code(404).send({ error: 'Goal not found' });
      }

      if (goal.userId !== userId) {
        return reply.code(403).send({ error: 'You are not authorized to delete this goal' });
      }

      await fastify.prisma.goal.delete({
        where: { id },
      });

      return reply.send({ success: true, data: goal });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });


  fastify.post('/:id/recommendations/tasks', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {


    try {
      const userId = request.user.id;
      const { id } = request.params as { id: string };
      const { taskIds } = request.body as { taskIds: string[] };

      const goal = await fastify.prisma.goal.findFirst({
        where: { id, userId, },
      });

      if (!goal) {
        return reply.code(404).send({ error: 'Goal not found' });
      }

      if (goal.userId !== userId) {
        return reply.code(403).send({ error: 'You are not authorized to access this goal' });
      }

      const schemaTasksRecommendation = z.object({
        tasks: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
          })
        )
      });

      const prompt = `
      You are a goal recommendation system.
      You are given a goal and a list of tasks.
      You need to recommend a list of tasks around 2 or 3 tasks that are related to the goal.
      Fast, simple and concise. actionable tasks.
      Diversity of tasks and the difficulty, perspsectives and approaches. 

      The goal is: ${goal.title}
      Description: ${goal.description}
      The tasks are: ${taskIds.join(', ')}
             Return the tasks in a list of objects with the following schema:
        [
          {
            title: string,
            description: string,
          }
        ]
        
        ${schemaTasksRecommendation.toString()}
      `;


      const response = await aiService.generateObject({
        // output: 'array',
        model: LLM_EXPENSIVE_MODELS_NAME?.GPT_4O,
        systemPrompt: `
        You are a goal recommendation system.
        You are given a goal and a list of tasks.
        You need to recommend a list of tasks around 2 or 3 tasks that are related to the goal.
        Fast, simple and concise. actionable tasks.
        Diversity of tasks and the difficulty, perspsectives and approaches. 
        The goal is: ${goal.title}
        Description: ${goal.description}
        Return the tasks in a list of objects with the following schema:
        [
          {
            title: string,
            description: string,
          }
        ]
        
        ${schemaTasksRecommendation.toString()}
          
        `,
        schema: schemaTasksRecommendation,
        // schema: z.object({
        //   tasks: z.array(z.object({
        //     title: z.string(),
        //     description: z.string(),
        //     // priority:z.enum(['low', 'medium', 'high']).optional(),
        //     // category: z.enum(['work', 'personal', 'health', 'finance', 'learning', 'other']).optional(),
        //     // tags: z.array(z.string()).optional(),
        //   })),
        // }),
        prompt: prompt,
      });
      console.log("response", response);
      return reply.send({ success: true, data: response?.object?.tasks });


    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }


  });


}

export default goalsRoutes;