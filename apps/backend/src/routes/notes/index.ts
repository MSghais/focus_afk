import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { pinata } from '../../services/pinata';
import { notesSchema, UpdateNotesInput, GetNotesInput, GetSourcesInput } from '../../validations/notes.validation';
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
      // Accepts: text, description, summary, topics, sources, aiSources, aiTopics, metadata, aiSummary, type, difficulty, requirements
      const note = await fastify.prisma.notes.create({
        data: {
          ...noteData,
          userId,
        },
      });
      return reply.code(201).send(note);
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
      const note = await fastify.prisma.notes.updateMany({
        where: { id: noteId, userId },
        data: updateData,
      });
      if (note.count === 0) {
        return reply.code(404).send({ message: 'Note not found' });
      }
      const updatedNote = await fastify.prisma.notes.findUnique({
        where: { id: noteId },
      });
      return reply.code(200).send(updatedNote);
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
        select: { sources: true },
      });
      // Flatten and dedupe sources
      const allSources = notes.flatMap(n => n.sources || []);
      const uniqueSources = Array.from(new Set(allSources));
      return reply.code(200).send({ sources: uniqueSources });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });
}

export default notesRoutes;
