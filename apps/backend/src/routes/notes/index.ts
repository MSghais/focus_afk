import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { pinata } from '../../services/pinata';
import { notesSchema, UpdateNotesInput, GetNotesInput, GetSourcesInput, NoteSourceInput } from '../../validations/notes.validation';
dotenv.config();

async function notesRoutes(fastify: FastifyInstance) {
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
}

export default notesRoutes;
