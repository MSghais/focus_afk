import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { pinata } from '../../services/pinata';
import { DEFAULT_MODEL, LLM_FREE_MODELS_NAME, LLM_MODELS_NAME } from '../../config/models';
import { AiService } from '../../services/ai/ai';
import { EnhancedAiService } from '../../services/ai/enhancedAiService';
import { ChatService } from '../../services/chat/chat.service';
import { buildContextString } from '../../services/helpers/contextHelper';
import { mentorSchema } from '../../validations/mentor.validation';
import type { CreateMentorInput, UpdateMentorInput, CreateMessageInput, GetMessagesInput, CreateFundingAccountInput, UpdateFundingAccountInput } from '../../validations/mentor.validation';
dotenv.config();

async function mentorRoutes(fastify: FastifyInstance) {
  const aiService = new AiService();
  const enhancedAiService = new EnhancedAiService(fastify.prisma);
  const chatService = new ChatService(fastify.prisma);

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

  // Chat endpoint with message saving and context/memory support
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
          sessionId: { type: 'string' },
          enableMemory: { type: 'boolean' },
          contextSources: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['tasks', 'goals', 'sessions', 'profile', 'mentor', 'badges', 'quests', 'settings']
            }
          },
          systemPrompt: { type: 'string' },
          extraData: { type: 'object' }
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const {
        prompt,
        model = DEFAULT_MODEL,
        mentorId,
        sessionId,
        enableMemory = true,
        contextSources = ['tasks', 'goals', 'sessions', 'profile', 'mentor'],
        // systemPrompt,
        extraData
      } = request.body as any;


      let systemPrompt = `
      You are a mentor.
      You are given a prompt and a list of tasks, goals, sessions, profile, mentor, badges, quests, settings.
      You need to respond to the prompt based on the context and conversation history.
      Be friendly and engaging.
      Be helpful and informative.
      Be professional and respectful.
      Be concise and to the point.
      Be friendly and engaging.
      Be helpful and informative.
      Be short and concise, conversational.
      If need to ask questions, ask them in a friendly and engaging way.
      `;

      if (!prompt) {
        return reply.code(400).send({ message: 'Prompt is required' });
      }

      let memory = await enhancedAiService.getMemoryContext(userId, mentorId, sessionId);
      // If extraData is provided, merge it into the context
      if (enableMemory && extraData && memory) {
        // Merge extraData into the userContext
        memory = await enhancedAiService.memoryManager.updateMemory(
          sessionId || `${userId}_${mentorId || 'default'}`,
          { userContext: { ...memory.userContext, ...extraData } }
        );
      }

      // Use the context helper to build the context string
      let enhancedPrompt = prompt;
      if (enableMemory && memory) {
        const contextString = buildContextString(memory, contextSources);
        enhancedPrompt = `${contextString}\n\nCurrent User Message: ${prompt}\n\nPlease respond as the AI mentor, taking into account the user's current context and conversation history. Provide personalized, actionable advice.`;
      }

      // Generate response using the enhanced AI service
      const response = await enhancedAiService.generateTextWithMemory({
        model,
        systemPrompt,
        prompt,
        userId,
        mentorId,
        sessionId,
        enableMemory,
        contextSources
      });

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      // Get or create a chat for this mentor
      let chat;
      if (mentorId) {
        chat = await chatService.getOrCreateMentorChat(userId, mentorId);
      } else {
        // Create a standalone chat if no mentor is specified
        chat = await chatService.createChat(userId, {
          title: 'General Chat',
          metadata: {
            sessionId: response.memory.sessionId,
            enableMemory,
            contextSources,
          }
        });
      }

      // Save the conversation to the chat
      const conversation = await chatService.saveConversation(
        chat.id,
        userId,
        prompt,
        response.text,
        {
          model,
          tokens: response.usage?.total_tokens,
          metadata: {
            sessionId: response.memory.sessionId,
            contextVersion: response.memory.contextVersion,
            memorySize: response.memory.memorySize,
            dataSources: response.memory.dataSources,
            sources: response.sources,
            usage: response.usage,
            originalPrompt: prompt,
            enhancedPrompt: enhancedPrompt,
            extraData: extraData || null
          }
        }
      );

      return reply.code(200).send({
        success: true,
        data: {
          response: response.text,
          chatId: chat.id,
          messageId: conversation.assistantMessage.id,
          memory: response.memory,
          usage: response.usage,
          originalPrompt: prompt,
          enhancedPrompt: enhancedPrompt
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get messages for a user (legacy endpoint - now returns standalone messages)
  fastify.get('/messages', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: mentorSchema.getMessages,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { mentorId, limit, offset } = request.query as GetMessagesInput;

      // Get standalone messages (not linked to any chat)
      const messages = await fastify.prisma.message.findMany({
        where: {
          userId,
          // Only standalone messages (not linked to any chat)
          // Note: This will work after schema migration
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return reply.code(200).send(messages);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get chats for a user (new endpoint)
  fastify.get('/chats', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          mentorId: { type: 'string' },
          isActive: { type: 'boolean' },
          limit: { type: 'number', minimum: 1, maximum: 100 },
          offset: { type: 'number', minimum: 0 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { mentorId, isActive, limit, offset } = request.query as any;

      const chats = await chatService.getUserChats(userId, {
        mentorId,
        isActive,
        limit,
        offset,
      });

      return reply.code(200).send(chats);
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
