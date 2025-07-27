import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { pinata } from '../../services/pinata';
import { notesSchema, UpdateNotesInput, GetNotesInput, GetSourcesInput, NoteSourceInput, ChatAboutNotesInput } from '../../validations/notes.validation';


dotenv.config();

async function notesRoutes(fastify: FastifyInstance) {
  // Import AI service
  const { EnhancedAiService } = await import('../../ai/enhancedAiService');
  const { ChatService } = await import('../../services/chat/chat.service');

  // Check if the plugin is already registered
  if (!fastify.hasContentTypeParser('multipart/form-data')) {
    fastify.register(fastifyMultipart);
  }

  // Create a new note (by user or AI)
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: notesSchema.createNotes,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const noteData = request.body as any;

      // Extract noteSources for separate handling
      const { noteSources, ...noteFields } = noteData;

      // Create the note
      const note = await fastify.prisma.notes.create({
        data: {
          ...noteFields,
          userId,
        },
      });

      // Create associated sources if provided
      if (noteSources && Array.isArray(noteSources)) {
        await fastify.prisma.noteSources.createMany({
          data: noteSources.map((source: NoteSourceInput) => ({
            noteId: note.id,
            type: source.type,
            title: source.title,
            content: source.content,
            url: source.url,
            fileType: source.fileType,
            fileSize: source.fileSize,
            metadata: source.metadata,
          })),
        });
      }

      // Return the note with its sources
      const noteWithSources = await fastify.prisma.notes.findUnique({
        where: { id: note.id },
        include: {
          noteSources: true,
        },
      });

      return reply.code(201).send(noteWithSources);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get user's notes, filter by type (user/ai) if provided
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: notesSchema.getNotes,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { type, limit = 50, offset = 0 } = request.query as GetNotesInput;
      const where: any = { userId };
      if (type) where.type = type;
      const notes = await fastify.prisma.notes.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          noteSources: true,
        },
      });
      return reply.code(200).send({
        data: notes,
        success: true,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get a specific note by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const noteId = (request.params as { id: string }).id;

      const note = await fastify.prisma.notes.findFirst({
        where: { id: noteId, userId },
        include: {
          noteSources: true,
        },
      });

      if (!note) {
        return reply.code(404).send({ message: 'Note not found' });
      }

      return reply.code(200).send({
        success: true,
        data: note,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Update a note
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      body: notesSchema.updateNotes,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const noteId = (request.params as { id: string }).id;
      const updateData = request.body as UpdateNotesInput;

      // Extract noteSources for separate handling
      const { noteSources, ...noteFields } = updateData;

      // Update the note
      const note = await fastify.prisma.notes.updateMany({
        where: { id: noteId, userId },
        data: noteFields,
      });



      if (note.count === 0) {
        return reply.code(404).send({ message: 'Note not found' });
      }

      // Update sources if provided
      if (noteSources !== undefined) {
        // Delete existing sources
        await fastify.prisma.noteSources.deleteMany({
          where: { noteId },
        });

        // Create new sources if provided
        if (Array.isArray(noteSources) && noteSources.length > 0) {
          await fastify.prisma.noteSources.createMany({
            data: noteSources.map((source: NoteSourceInput) => ({
              noteId,
              type: source.type,
              title: source.title,
              content: source.content,
              url: source.url,
              fileType: source.fileType,
              fileSize: source.fileSize,
              metadata: source.metadata,
            })),
          });
        }
      }

      // Return the updated note with sources
      const updatedNote = await fastify.prisma.notes.findUnique({
        where: { id: noteId },
        include: {
          noteSources: true,
        },
      });

      return reply.code(200).send({
        success: true,
        data: updatedNote,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Delete a note (hard delete)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const noteId = (request.params as { id: string }).id;

      // Delete associated sources first (cascade should handle this, but being explicit)
      await fastify.prisma.noteSources.deleteMany({
        where: { noteId },
      });

      const note = await fastify.prisma.notes.deleteMany({
        where: { id: noteId, userId },
      });

      if (note.count === 0) {
        return reply.code(404).send({ message: 'Note not found' });
      }

      return reply.code(200).send({ message: 'Note deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get all unique sources for a user's notes, optionally filtered by type
  fastify.get('/sources', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: notesSchema.getSources,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { type } = request.query as GetSourcesInput;
      const where: any = { userId };
      if (type) where.type = type;

      const notes = await fastify.prisma.notes.findMany({
        where,
        include: {
          noteSources: true,
        },
      });

      // Extract structured sources
      const allSources = notes.flatMap(n => n.noteSources || []);

      // Group sources by type for better organization
      const sourcesByType = allSources.reduce((acc, source) => {
        if (!acc[source.type]) {
          acc[source.type] = [];
        }
        acc[source.type].push({
          id: source.id,
          title: source.title,
          url: source.url,
          type: source.type,
        });
        return acc;
      }, {} as Record<string, any[]>);

      return reply.code(200).send({
        sources: allSources,
        sourcesByType,
        totalSources: allSources.length,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get sources by type
  fastify.get('/sources/:type', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const sourceType = (request.params as { type: string }).type;

      const sources = await fastify.prisma.noteSources.findMany({
        where: {
          note: {
            userId,
          },
          type: sourceType,
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      });

      return reply.code(200).send({
        sources,
        type: sourceType,
        count: sources.length,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });



  // Chat about a specific note and its sources
  fastify.post('/chat', {
    preHandler: [fastify.authenticate],
    schema: {
      body: notesSchema.chatAboutNotes,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { noteId, prompt, mentorId } = request.body as ChatAboutNotesInput;

      // Get the note with its sources
      const note = await fastify.prisma.notes.findFirst({
        where: {
          id: noteId,
          userId // Ensure user owns the note
        },
        include: {
          noteSources: true,
        },
      });

      if (!note) {
        return reply.code(404).send({ message: 'Note not found' });
      }


      const aiService = new EnhancedAiService(fastify.prisma);
      const chatService = new ChatService(fastify.prisma);

      // Build context from note and sources
      let contextString = `Note Information:\n`;
      contextString += `Title: ${note.title || 'Untitled'}\n`;
      contextString += `Type: ${note.type || 'user'}\n`;
      contextString += `Difficulty: ${note.difficulty || 'Not specified'}\n`;
      contextString += `Created: ${note.createdAt.toISOString()}\n\n`;

      if (note.text) {
        contextString += `Note Content:\n${note.text}\n\n`;
      }

      if (note.description) {
        contextString += `Description:\n${note.description}\n\n`;
      }

      if (note.summary) {
        contextString += `Summary:\n${note.summary}\n\n`;
      }

      if (note.topics && note.topics.length > 0) {
        contextString += `Topics: ${note.topics.join(', ')}\n\n`;
      }

      const messages = await fastify.prisma.message.findMany({
        where: {
          userId,
          chat: {
            metadata: {
              path: ['noteId'],
              equals: noteId
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      for(let i = 0; i < messages.length; i++) {
        contextString += `Message ${i + 1}:\n${messages[i].content}\n\n`;
      }

      // Add sources context
      if (note.noteSources && note.noteSources.length > 0) {
        contextString += `Sources:\n`;
        note.noteSources.forEach((source, index) => {
          contextString += `${index + 1}. ${source.title} (${source.type})\n`;
          if (source.content) {
            contextString += `   Content: ${source.content.substring(0, 200)}${source.content.length > 200 ? '...' : ''}\n`;
          }
          if (source.url) {
            contextString += `   URL: ${source.url}\n`;
          }
          contextString += `\n`;
        });
      }

      // Create system prompt for note-specific chat
      const systemPrompt = `You are an AI assistant helping the user understand and work with their notes. 
      
You have access to the following note information and sources. Use this context to provide helpful, accurate, and relevant responses to the user's questions about their note.

Be conversational, helpful, and provide actionable insights. If the user asks about specific sources, reference them appropriately. If they ask for clarification or expansion of ideas in the note, provide thoughtful responses based on the content available.

Current Note Context:
${contextString}

Please respond to the user's question about this note and its sources.`;

      // Generate AI response
      const response = await aiService.generateTextWithMemory({
        model: 'openai/gpt-4o-mini',
        systemPrompt,
        prompt,
        userId,
        mentorId: mentorId || undefined,
        sessionId: `note_chat_${noteId}`,
        enableMemory: true,
        contextSources: ['tasks', 'goals', 'sessions', 'profile', 'mentor'],
      });

      if (!response) {
        return reply.code(500).send({ message: 'Failed to generate response' });
      }

      // Get or create a chat for this note conversation
      let chat;

      if (mentorId) {
        // If mentor is specified, use the mentor chat system
        chat = await chatService.getOrCreateMentorChat(userId, mentorId);
      } else {
        // If no mentor specified, create a note-specific chat
        // Try to find existing chat for this note
        const existingChats = await fastify.prisma.chat.findMany({
          where: {
            userId,
            isActive: true,
            metadata: {
              path: ['noteId'],
              equals: noteId
            }
          },
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          take: 1,
          orderBy: { updatedAt: 'desc' }
        });

        if (existingChats.length === 0) {
          chat = await chatService.createChat(userId, {
            title: `Chat about: ${note.title || 'Note'}`,
            metadata: {
              noteId,
              noteType: note.type,
              sessionId: `note_chat_${noteId}`,
            }
          });
        } else {
          chat = existingChats[0];
        }
      }

      // Save the conversation
      const conversation = await chatService.saveConversation(
        chat.id,
        userId,
        prompt,
        response.text,
        {
          model: 'openai/gpt-4o-mini',
          tokens: response.usage?.total_tokens,
          mentorId: mentorId || undefined,
          metadata: {
            noteId,
            noteType: note.type,
            sessionId: `note_chat_${noteId}`,
            contextVersion: response.memory?.contextVersion,
            memorySize: response.memory?.memorySize,
            dataSources: response.memory?.dataSources,
            sources: response.sources,
            usage: response.usage,
            originalPrompt: prompt,
            noteContext: contextString.substring(0, 500) + '...', // Truncate for storage
          }
        }
      );

      return reply.code(200).send({
        success: true,
        data: {
          response: response.text,
          chatId: chat.id,
          messageId: conversation.assistantMessage.id,
          note: {
            id: note.id,
            title: note.title,
            type: note.type,
            sourcesCount: note.noteSources?.length || 0,
          },
          memory: response.memory,
          usage: response.usage,
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get chat messages for a specific note
  fastify.get('/:id/chat', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const noteId = (request.params as { id: string }).id;
      const { limit = 50, offset = 0 } = request.query as any;

      // Verify the note exists and belongs to the user
      const note = await fastify.prisma.notes.findFirst({
        where: {
          id: noteId,
          userId
        },
        select: { id: true, title: true }
      });

      if (!note) {
        return reply.code(404).send({ message: 'Note not found' });
      }

      // Find the chat associated with this note
      const chat = await fastify.prisma.chat.findFirst({
        where: {
          userId,
          isActive: true,
          metadata: {
            path: ['noteId'],
            equals: noteId
          }
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        }
      });

      if (!chat) {
        return reply.code(200).send({
          success: true,
          data: {
            messages: [],
            chat: null,
            note: {
              id: note.id,
              title: note.title,
            }
          }
        });
      }

      // Get messages for this chat
      const messages = await fastify.prisma.message.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      });

      return reply.code(200).send({
        success: true,
        data: {
          messages,
          chat: {
            id: chat.id,
            title: chat.title,
            mentor: chat.mentor,
          },
          note: {
            id: note.id,
            title: note.title,
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });
 
}

export default notesRoutes;
