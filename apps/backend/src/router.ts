import type { FastifyInstance } from 'fastify';


import { authRoutes } from './routes/auth';
import uploadFile from './routes/upload/upload-file';
import mentorRoutes from './routes/mentor';
import chatRoutes from './routes/chat';
import gamificationRoutes from './routes/gamification';
import focusRoutes from './routes/focus';
import badgesRoutes from './routes/badges';
import timerRoutes from './routes/timer';
import goalsRoutes from './routes/goals';
import tasksRoutes from './routes/tasks';
import questsRoutes from './routes/quests';
import notesRoutes from './routes/notes';
import sourceAgentRoutes from './routes/notes/source-agent';
import audioRoutes from './routes/audio';
import enhancedChatRoutes from './routes/enhanced-chat';
import enhancedQuestsRoutes from './routes/enhanced-quests';
function declareRoutes(
  fastify: FastifyInstance,
  // deployer: Account,
  // twilio_services: ServiceContext
) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(uploadFile, { prefix: '/upload' });
  fastify.register(mentorRoutes, { prefix: '/mentor' });
  fastify.register(chatRoutes, { prefix: '/chat' });
  fastify.register(gamificationRoutes, { prefix: '/gamification' });
  fastify.register(focusRoutes, { prefix: '/focus' });
  fastify.register(badgesRoutes, { prefix: '/badges' });
  fastify.register(timerRoutes, { prefix: '/timer' });
  fastify.register(goalsRoutes, { prefix: '/goals' });
  fastify.register(tasksRoutes, { prefix: '/tasks' });
  fastify.register(questsRoutes, { prefix: '/quests' });
  fastify.register(notesRoutes, { prefix: '/notes' });
  fastify.register(sourceAgentRoutes, { prefix: '/notes/source-agent' });
  fastify.register(audioRoutes, { prefix: '/audio' });
  fastify.register(enhancedChatRoutes, { prefix: '/enhanced-chat' });
  fastify.register(enhancedQuestsRoutes, { prefix: '/enhanced-quests' });
}

export default declareRoutes;
