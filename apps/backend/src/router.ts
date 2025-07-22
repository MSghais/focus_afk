import type { FastifyInstance } from 'fastify';


import { authRoutes } from './routes/auth';
import uploadFile from './routes/upload/upload-file';
function declareRoutes(
  fastify: FastifyInstance,
  // deployer: Account,
  // twilio_services: ServiceContext
) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(uploadFile);
}

export default declareRoutes;
