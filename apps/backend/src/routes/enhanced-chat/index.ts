import type { FastifyInstance } from 'fastify';
import { EnhancedVectorAiService } from '../../ai/enhancedVectorAiService';
import { z } from 'zod';

// Validation schemas
const enhancedChatSchema = {
  generalChat: {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: { type: 'string', minLength: 1 },
      mentorId: { type: 'string' },
      sessionId: { type: 'string' },
      model: { type: 'string', default: 'openai/gpt-4o-mini' },
      extraData: { type: 'object' },
      saveToChat: { type: 'boolean', default: true },
      chatId: { type: 'string' }
    }
  },
  useCaseChat: {
    type: 'object',
    required: ['prompt', 'useCase'],
    properties: {
      prompt: { type: 'string', minLength: 1 },
      useCase: { 
        type: 'string',
        enum: ['task_planning', 'goal_tracking', 'focus_sessions', 'note_analysis', 'mentor_specific', 'quick_question', 'deep_analysis', 'general_chat']
      },
      mentorId: { type: 'string' },
      sessionId: { type: 'string' },
      model: { type: 'string' },
      customSystemPrompt: { type: 'string' },
      extraData: { type: 'object' },
      enableVectorSearch: { type: 'boolean' },
      contextSources: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['tasks', 'goals', 'sessions', 'notes', 'badges', 'quests', 'profile', 'mentor', 'settings']
        }
      },
      maxVectorResults: { type: 'number', minimum: 1, maximum: 20 },
      saveToChat: { type: 'boolean', default: true },
      chatId: { type: 'string' }
    }
  },
  searchContent: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { type: 'string', minLength: 1 },
      types: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['task', 'goal', 'session', 'note', 'message', 'profile']
        }
      },
      limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
    }
  }
};

async function enhancedChatRoutes(fastify: FastifyInstance) {
  const enhancedAiService = new EnhancedVectorAiService(fastify.prisma);

  // Get available use cases
  fastify.get('/use-cases', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const useCases = enhancedAiService.getAvailableUseCases();
      return reply.send({ useCases });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // General chat with enhanced context
  fastify.post('/chat', {
    preHandler: [fastify.authenticate],
    schema: {
      body: enhancedChatSchema.generalChat,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { prompt, mentorId, sessionId, model, extraData, saveToChat = true, chatId } = request.body as any;

      const response = await enhancedAiService.generateResponse({
        model: model || 'openai/gpt-4o-mini',
        prompt,
        userId,
        mentorId,
        sessionId,
        useCase: 'general_chat',
        extraData,
        saveToChat,
        chatId
      });

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      return reply.send({
        text: response.text,
        metadata: response.metadata,
        context: {
          vectorSearchUsed: response.context.metadata.vectorSearchUsed,
          contextSources: response.context.metadata.contextSources,
          vectorResultsCount: response.context.metadata.vectorResultsCount
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Use case specific chat
  fastify.post('/chat/use-case', {
    preHandler: [fastify.authenticate],
    schema: {
      body: enhancedChatSchema.useCaseChat,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const {
        prompt,
        useCase,
        mentorId,
        sessionId,
        model = 'openai/gpt-4o-mini',
        customSystemPrompt,
        extraData,
        enableVectorSearch,
        contextSources,
        maxVectorResults,
        saveToChat = true,
        chatId
      } = request.body as any;

      const response = await enhancedAiService.generateResponse({
        model,
        prompt,
        userId,
        mentorId,
        sessionId,
        useCase,
        customSystemPrompt,
        extraData,
        enableVectorSearch,
        contextSources,
        maxVectorResults,
        saveToChat,
        chatId
      });

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      if(response?.text ) {
        try {
          const message = await fastify.prisma.message.create({
            data: {
              content: response.text,
              userId,
              mentorId,
              chatId,
              // sessionId: sessionId || '',
              // type: 'message',
              role: 'assistant',
              createdAt: new Date(),
            }
          })  
        } catch (error) {
          console.error("Error saving message to database", error);
          
        }
      }

      return reply.send({
        text: response.text,
        metadata: response.metadata,
        context: {
          vectorSearchUsed: response.context.metadata.vectorSearchUsed,
          contextSources: response.context.metadata.contextSources,
          vectorResultsCount: response.context.metadata.vectorResultsCount,
          totalContextSize: response.context.metadata.totalContextSize
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Task planning assistance
  fastify.post('/assist/task-planning', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          mentorId: { type: 'string' },
          sessionId: { type: 'string' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { prompt, mentorId, sessionId } = request.body as any;

      const response = await enhancedAiService.assistWithTaskPlanning(
        userId,
        prompt,
        mentorId,
        sessionId
      );

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      try {
        const message = await fastify.prisma.message.create({
          data: {
            content: response.text,
            userId,
            mentorId,
            chatId: sessionId,
            role: 'assistant',
            createdAt: new Date(),
          }
        })
      } catch (error) {
        console.error("Error saving message to database", error);
      }

      return reply.send({
        text: response.text,
        metadata: response.metadata,
        context: {
          vectorSearchUsed: response.context.metadata.vectorSearchUsed,
          contextSources: response.context.metadata.contextSources,
          vectorResultsCount: response.context.metadata.vectorResultsCount
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Goal tracking assistance
  fastify.post('/assist/goal-tracking', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          mentorId: { type: 'string' },
          sessionId: { type: 'string' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { prompt, mentorId, sessionId } = request.body as any;

      const response = await enhancedAiService.assistWithGoalTracking(
        userId,
        prompt,
        mentorId,
        sessionId
      );

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      return reply.send({
        text: response.text,
        metadata: response.metadata,
        context: {
          vectorSearchUsed: response.context.metadata.vectorSearchUsed,
          contextSources: response.context.metadata.contextSources,
          vectorResultsCount: response.context.metadata.vectorResultsCount
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Focus session optimization
  fastify.post('/assist/focus-sessions', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          sessionData: { type: 'object' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { prompt, sessionData } = request.body as any;

      const response = await enhancedAiService.optimizeFocusSessions(
        userId,
        prompt,
        sessionData
      );

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      return reply.send({
        text: response.text,
        metadata: response.metadata,
        context: {
          vectorSearchUsed: response.context.metadata.vectorSearchUsed,
          contextSources: response.context.metadata.contextSources,
          vectorResultsCount: response.context.metadata.vectorResultsCount
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Note analysis
  fastify.post('/assist/note-analysis', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          noteContext: { type: 'object' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { prompt, noteContext } = request.body as any;

      const response = await enhancedAiService.analyzeNotes(
        userId,
        prompt,
        noteContext
      );

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      return reply.send({
        text: response.text,
        metadata: response.metadata,
        context: {
          vectorSearchUsed: response.context.metadata.vectorSearchUsed,
          contextSources: response.context.metadata.contextSources,
          vectorResultsCount: response.context.metadata.vectorResultsCount
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Search user content
  fastify.post('/search', {
    preHandler: [fastify.authenticate],
    schema: {
      body: enhancedChatSchema.searchContent,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { query, types, limit } = request.body as any;

      const results = await enhancedAiService.searchUserContent(
        userId,
        query,
        types,
        limit
      );

      return reply.send({ results });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get context statistics
  fastify.get('/context/stats', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const stats = await enhancedAiService.getContextStats(userId);
      return reply.send({ stats });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Update user embeddings
  fastify.post('/context/update-embeddings', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          dataTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['tasks', 'goals', 'sessions', 'notes', 'messages', 'profile']
            }
          }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { dataTypes } = request.body as any;

      await enhancedAiService.updateUserEmbeddings(userId, dataTypes);

      return reply.send({ message: 'Embeddings updated successfully' });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Quick question (minimal context)
  fastify.post('/quick-question', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { prompt } = request.body as any;

      const response = await enhancedAiService.quickQuestion(userId, prompt);

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      return reply.send({
        text: response.text,
        metadata: response.metadata
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Deep analysis
  fastify.post('/deep-analysis', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          mentorId: { type: 'string' },
          sessionId: { type: 'string' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { prompt, mentorId, sessionId } = request.body as any;

      const response = await enhancedAiService.deepAnalysis(
        userId,
        prompt,
        mentorId,
        sessionId
      );

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      return reply.send({
        text: response.text,
        metadata: response.metadata,
        context: {
          vectorSearchUsed: response.context.metadata.vectorSearchUsed,
          contextSources: response.context.metadata.contextSources,
          vectorResultsCount: response.context.metadata.vectorResultsCount,
          totalContextSize: response.context.metadata.totalContextSize
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get all messages for a user
  fastify.get('/messages', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 },
          chatId: { type: 'string' },
          mentorId: { type: 'string' },
          useCase: { type: 'string' },
          role: { type: 'string', enum: ['user', 'assistant', 'system'] },
          startDate: { type: 'string' },
          endDate: { type: 'string' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { 
        limit = 50, 
        offset = 0, 
        chatId, 
        mentorId, 
        useCase, 
        role,
        startDate,
        endDate
      } = request.query as any;

      // Build where clause
      const whereClause: any = { userId };

      if (chatId) {
        whereClause.chatId = chatId;
      }

      if (mentorId) {
        whereClause.mentorId = mentorId;
      }

      if (role) {
        whereClause.role = role;
      }

      if (useCase) {
        whereClause.metadata = {
          path: ['useCase'],
          equals: useCase
        };
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt.lte = new Date(endDate);
        }
      }

      const messages = await fastify.prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          chat: {
            select: {
              id: true,
              title: true,
              mentorId: true
            }
          },
          mentor: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      const totalCount = await fastify.prisma.message.count({
        where: whereClause
      });

      return reply.send({
        messages,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get messages for a specific chat
  fastify.get('/messages/chat/:chatId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['chatId'],
        properties: {
          chatId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { chatId } = request.params as any;
      const { limit = 50, offset = 0 } = request.query as any;

      // Verify the chat belongs to the user
      const chat = await fastify.prisma.chat.findFirst({
        where: { id: chatId, userId }
      });

      if (!chat) {
        return reply.code(404).send({ message: 'Chat not found' });
      }

      const messages = await fastify.prisma.message.findMany({
        where: { chatId, userId },
        orderBy: { createdAt: 'asc' }, // Chronological order for chat
        take: limit,
        skip: offset,
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      const totalCount = await fastify.prisma.message.count({
        where: { chatId, userId }
      });

      return reply.send({
        chat,
        messages,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get message statistics for a user
  fastify.get('/messages/stats', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const [
        totalMessages,
        userMessages,
        assistantMessages,
        totalChats,
        messagesByUseCase,
        recentActivity
      ] = await Promise.all([
        // Total messages
        fastify.prisma.message.count({ where: { userId } }),
        
        // User messages
        fastify.prisma.message.count({ 
          where: { userId, role: 'user' } 
        }),
        
        // Assistant messages
        fastify.prisma.message.count({ 
          where: { userId, role: 'assistant' } 
        }),
        
        // Total chats
        fastify.prisma.chat.count({ 
          where: { userId, isActive: true } 
        }),
        
        // Messages by use case
        fastify.prisma.message.groupBy({
          by: ['metadata'],
          where: { userId },
          _count: { id: true }
        }),
        
        // Recent activity (last 7 days)
        fastify.prisma.message.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      // Process use case statistics
      const useCaseStats = messagesByUseCase.reduce((acc: any, group: any) => {
        const useCase = group.metadata?.useCase || 'unknown';
        acc[useCase] = (acc[useCase] || 0) + group._count.id;
        return acc;
      }, {});

      return reply.send({
        totalMessages,
        userMessages,
        assistantMessages,
        totalChats,
        useCaseStats,
        recentActivity,
        averageMessagesPerChat: totalChats > 0 ? Math.round(totalMessages / totalChats) : 0
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Delete a specific message
  fastify.delete('/messages/:messageId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['messageId'],
        properties: {
          messageId: { type: 'string' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { messageId } = request.params as any;

      // Verify the message belongs to the user
      const message = await fastify.prisma.message.findFirst({
        where: { id: messageId, userId }
      });

      if (!message) {
        return reply.code(404).send({ message: 'Message not found' });
      }

      await fastify.prisma.message.delete({
        where: { id: messageId }
      });

      return reply.send({ message: 'Message deleted successfully' });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Delete all messages for a user (with optional filters)
  fastify.delete('/messages', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          chatId: { type: 'string' },
          mentorId: { type: 'string' },
          useCase: { type: 'string' },
          beforeDate: { type: 'string' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { chatId, mentorId, useCase, beforeDate } = request.body as any;

      // Build where clause
      const whereClause: any = { userId };

      if (chatId) {
        whereClause.chatId = chatId;
      }

      if (mentorId) {
        whereClause.mentorId = mentorId;
      }

      if (useCase) {
        whereClause.metadata = {
          path: ['useCase'],
          equals: useCase
        };
      }

      if (beforeDate) {
        whereClause.createdAt = {
          lt: new Date(beforeDate)
        };
      }

      const deletedCount = await fastify.prisma.message.deleteMany({
        where: whereClause
      });

      return reply.send({ 
        message: 'Messages deleted successfully',
        deletedCount: deletedCount.count
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });
}

export default enhancedChatRoutes; 