import type { FastifyInstance } from 'fastify';
import { ChatService } from '../../services/chat/chat.service';

async function chatRoutes(fastify: FastifyInstance) {
  const chatService = new ChatService(fastify.prisma);

  // Create a new chat
  fastify.post('/chats', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          mentorId: { type: 'string' },
          title: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const chatData = request.body as any;

      const chat = await chatService.createChat(userId, chatData);

      return reply.code(201).send(chat);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get user's chats
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

  // Get a specific chat with messages
  fastify.get('/chats/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const chatId = (request.params as { id: string }).id;

      const chat = await chatService.getChat(chatId, userId);

      if (!chat) {
        return reply.code(404).send({ message: 'Chat not found' });
      }

      return reply.code(200).send(chat);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Update a chat
  fastify.put('/chats/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          isActive: { type: 'boolean' },
          metadata: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const chatId = (request.params as { id: string }).id;
      const updateData = request.body as any;

      const chat = await chatService.updateChat(chatId, userId, updateData);

      return reply.code(200).send(chat);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error && error.message === 'Chat not found') {
        return reply.code(404).send({ message: 'Chat not found' });
      }
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Delete a chat
  fastify.delete('/chats/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const chatId = (request.params as { id: string }).id;

      const result = await chatService.deleteChat(chatId, userId);

      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error && error.message === 'Chat not found') {
        return reply.code(404).send({ message: 'Chat not found' });
      }
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get messages for a chat
  fastify.get('/chats/:id/messages', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100 },
          offset: { type: 'number', minimum: 0 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const chatId = (request.params as { id: string }).id;
      const { limit, offset } = request.query as any;

      // console.log(`Getting messages for chat ${chatId}, user ${userId}, limit ${limit}, offset ${offset}`);

      const messages = await chatService.getChatMessages(chatId, userId, {
        limit,
        offset,
      });

      console.log(`Found ${messages.length} messages for chat ${chatId}`);

      return reply.code(200).send(messages);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error && error.message === 'Chat not found') {
        return reply.code(404).send({ message: 'Chat not found' });
      }
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Create a message in a chat
  fastify.post('/chats/:id/messages', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['user', 'assistant', 'system'] },
          content: { type: 'string', minLength: 1 },
          prompt: { type: 'string' },
          model: { type: 'string' },
          tokens: { type: 'number' },
          metadata: { type: 'object' },
          taskId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const chatId = (request.params as { id: string }).id;
      const messageData = request.body as any;

      // Verify the chat belongs to the user
      const chat = await chatService.getChat(chatId, userId);
      if (!chat) {
        return reply.code(404).send({ message: 'Chat not found' });
      }

      const message = await chatService.createMessage(chatId, userId, messageData);

      return reply.code(201).send(message);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get chat statistics
  fastify.get('/chats/stats', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const stats = await chatService.getChatStats(userId);

      return reply.code(200).send(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });
}

export default chatRoutes; 