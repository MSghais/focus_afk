import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { AudioService } from '../../ai/audioService';
import { EnhancedAiService } from '../../ai/enhancedAiService';

dotenv.config();

async function audioRoutes(fastify: FastifyInstance) {
  if (!fastify.hasContentTypeParser('multipart/form-data')) {
    fastify.register(fastifyMultipart);
  }

  fastify.post('/:id/note/summary', {
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

      let promptGeneration = `
      Summarize under 100 words or 1000 characters it:  
      You are a helpful assistant that generates audio summaries of notes.
      The note is: ${note.text}
      `

      let notesSourcesContext = note.noteSources.map((source) => {
        return `
        ${source.type}: ${source.url} ${source.title} ${source.type === 'text' ? `\n${source.content}` : ''} 
        `;
      }).join('\n');

      promptGeneration += `
      The notes sources are: ${notesSourcesContext}
      `

      console.log("promptGeneration", promptGeneration);

      const aiService = new EnhancedAiService(fastify.prisma);
      const aiResponse = await aiService.generateTextWithMemory({
        model: 'openai/gpt-4o-mini',
        prompt: promptGeneration,
        userId,
        contextSources: ['tasks', 'goals', 'sessions', 'profile', 'mentor', 'badges', 'quests', 'settings'],
      });


      let audioPrompt = aiResponse?.text;

      if (!audioPrompt) {
        return reply.code(500).send({ message: 'Issue generating audio prompt summary' });
      }
        
      const audioService = new AudioService(fastify.prisma);
      const audio = await audioService.generateAudio({
        model: 'openai/tts',
        prompt: audioPrompt,
        contextSources: ['tasks', 'goals', 'sessions', 'profile', 'mentor', 'badges', 'quests', 'settings'],
        userId,
      });

      return reply.send({
        data: audio,
        message: 'Audio generated successfully',
        status: 'success',
        statusCode: 200,
      });

    }
    catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }

  });



  fastify.post('/summary', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { text } = request.body as { text: string };

      if (!text) {
        return reply.code(400).send({ message: 'Text is required' });
      }

      if (!text?.length) {
        return reply.code(400).send({ message: 'Text is required' });
      }

      let prompt = text

      if (text.length > 1000) {
        prompt = text.slice(0, 1000);
      }

      let promptGeneration = `
      Summarize under 100 words or 1000 characters it:  
      You are a helpful assistant that generates audio summaries, conversations.
      The text is: ${text}
      `

      const audioService = new AudioService(fastify.prisma);
      const audio = await audioService.generateAudio({
        model: 'openai/tts',
        prompt: promptGeneration,
        contextSources: ['tasks', 'goals', 'sessions', 'profile', 'mentor', 'badges', 'quests', 'settings'],
        userId,
      });

      return reply.send({
        data: audio,
        message: 'Audio generated successfully',
        status: 'success',
        statusCode: 200,
      });

    }
    catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }

  });



}

export default audioRoutes;
