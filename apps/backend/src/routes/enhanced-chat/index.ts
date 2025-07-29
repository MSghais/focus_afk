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
      extraData: { type: 'object' }
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
      const { prompt, mentorId, sessionId, model, extraData } = request.body as any;

      const response = await enhancedAiService.generalChat(
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
}

export default enhancedChatRoutes; 