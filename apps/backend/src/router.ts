import type { FastifyInstance } from 'fastify';


import { authRoutes } from './routes/auth';
import uploadFile from './routes/upload/upload-file';
import mentorRoutes from './routes/mentor';
import gamificationRoutes from './routes/gamification';
import focusRoutes from './routes/focus';
import badgesRoutes from './routes/badges';
function declareRoutes(
  fastify: FastifyInstance,
  // deployer: Account,
  // twilio_services: ServiceContext
) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(uploadFile, { prefix: '/upload' });
  fastify.register(mentorRoutes, { prefix: '/mentor' });
  fastify.register(gamificationRoutes, { prefix: '/gamification' });
  fastify.register(focusRoutes, { prefix: '/focus' });
  fastify.register(badgesRoutes, { prefix: '/badges' });
}

export default declareRoutes;
