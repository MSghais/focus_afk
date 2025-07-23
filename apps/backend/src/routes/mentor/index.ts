import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { pinata } from '../../services/pinata';
import { DEFAULT_MODEL, LLM_FREE_MODELS_NAME, LLM_MODELS_NAME } from '../../config/models';
import { AiService } from '../../services/ai/ai';
import { mentorSchema } from '../../validations/mentor.validation';
import type { CreateMentorInput, UpdateMentorInput, CreateMessageInput, GetMessagesInput, CreateFundingAccountInput, UpdateFundingAccountInput } from '../../validations/mentor.validation';
dotenv.config();

async function mentorRoutes(fastify: FastifyInstance) {
  const aiService = new AiService();

  // Check if the plugin is already registered
  if (!fastify.hasContentTypeParser('multipart/form-data')) {
    fastify.register(fastifyMultipart);
  }

  // Create a new mentor for the user
  fastify.post('/mentors', {
    preHandler: [fastify.authenticate],
    schema: {
      body: mentorSchema.createMentor,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const mentorData = request.body as CreateMentorInput;

      const mentor = await fastify.prisma.mentor.create({
        data: {
          ...mentorData,
          userId,
        },
      });

      return reply.code(201).send(mentor);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get user's mentors
  fastify.get('/mentors', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const mentors = await fastify.prisma.mentor.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.code(200).send(mentors);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Update a mentor
  fastify.put('/mentors/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      body: mentorSchema.updateMentor,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const mentorId = (request.params as { id: string }).id;
      const updateData = request.body as UpdateMentorInput;

      const mentor = await fastify.prisma.mentor.updateMany({
        where: { id: mentorId, userId },
        data: updateData,
      });

      if (mentor.count === 0) {
        return reply.code(404).send({ message: 'Mentor not found' });
      }

      const updatedMentor = await fastify.prisma.mentor.findUnique({
        where: { id: mentorId },
      });

      return reply.code(200).send(updatedMentor);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Delete a mentor (soft delete by setting isActive to false)
  fastify.delete('/mentors/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const mentorId = (request.params as { id: string }).id;

      const mentor = await fastify.prisma.mentor.updateMany({
        where: { id: mentorId, userId },
        data: { isActive: false },
      });

      if (mentor.count === 0) {
        return reply.code(404).send({ message: 'Mentor not found' });
      }

      return reply.code(200).send({ message: 'Mentor deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Chat endpoint with message saving
  fastify.post('/chat', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          model: { type: 'string' },
          mentorId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { prompt, model, mentorId, taskId } = request.body as { prompt: string; model?: string; mentorId?: string; taskId?: string };

      console.log('prompt', prompt);
      console.log('model', model);
      console.log('mentorId', mentorId);
      console.log('taskId', taskId);
      if (!prompt) {
        return reply.code(400).send({ message: 'Prompt is required' });
      }

      const modelName = DEFAULT_MODEL;
      const response = await aiService.generateTextLlm({
        model: modelName,
        prompt: prompt,
      });

      console.log('response', response);

      // Save user message
      await fastify.prisma.message.create({
        data: {
          userId,
          mentorId,
          role: 'user',
          content: prompt,
          model: modelName,
          // taskId,
          },
      });

      // Save assistant response
      await fastify.prisma.message.create({
        data: {
          userId,
          mentorId,
          role: 'assistant',
          content: response?.text ?? '',
          model: modelName,
          // taskId,
        },
      });

      return reply.code(200).send({
        response,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get messages for a user
  fastify.get('/messages', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: mentorSchema.getMessages,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { mentorId, limit, offset } = request.query as GetMessagesInput;

      const whereClause: any = { userId };
      if (mentorId) {
        whereClause.mentorId = mentorId;
      }

      const messages = await fastify.prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return reply.code(200).send(messages);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // File upload endpoint (existing)
  fastify.post('/my-mentor-file', async (request, reply) => {
    try {
      const data = await request.file();
      const fileBuffer = await data?.toBuffer();
      const fileName = data?.filename ?? '';
      const fileType = data?.mimetype ?? "jpg"

      if (!fileBuffer) {
        return reply.code(400).send({ message: 'No file uploaded' });
      }

      const { IpfsHash } = await pinata.pinFileToIPFS(fileBuffer, {
        pinataMetadata: {
          name: fileName,
          type: fileType,
        },
      });

      return reply.code(200).send({
        hash: IpfsHash,
        url: `${process.env.IPFS_GATEWAY}/ipfs/${IpfsHash}`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });
}

export default mentorRoutes;
