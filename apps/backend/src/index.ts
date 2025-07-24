import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyIO from 'fastify-socket.io';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { config } from './config/index';
import { setupWebSocket } from './services/event/socket';
import authPlugin from './plugins/auth';
import jwt from 'jsonwebtoken';
import prismaPlugin from './plugins/prisma';
import { launchBot } from './services/telegram-app';
import declareRoutes from './router';
import fastifySession from '@fastify/session';
import fastifyOauth2 from '@fastify/oauth2';
import fastifyMultipart from '@fastify/multipart';
import { initCron } from './cron';
import dotenv from 'dotenv';
dotenv.config();

// Type declarations
declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}     

export const publicDir = path.join(__dirname, 'public');

async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  console.log('FRONTEND_URL', process.env.FRONTEND_URL);

  // CORS configuration
  await fastify.register(fastifyCors, {
    // origin: "*",
    origin: process.env.FRONTEND_URL,
    // origin: (origin, cb) => {
    //   // Allow requests with no origin (like mobile apps or curl requests)
    //   if (!origin) return cb(null, true);
      
    //   const allowedOrigins = [
    //     process.env.FRONTEND_URL,
    //     'https://focus.afk-community.xyz',
    //     'https://www.focus.afk-community.xyz/',
    //     'http://localhost:3000',
    //     'http://localhost:3001'
    //   ].filter(Boolean);
      
    //   console.log('CORS check - Origin:', origin);
    //   console.log('CORS check - Allowed origins:', allowedOrigins);
      
    //   // Check exact match
    //   if (allowedOrigins.includes(origin)) {
    //     return cb(null, true);
    //   }
      
    //   // Check if it's a subdomain of afk-community.xyz
    //   if (origin.endsWith('.afk-community.xyz') || origin === 'https://afk-community.xyz') {
    //     return cb(null, true);
    //   }
      
    //   // For development, allow all origins
    //   if (process.env.NODE_ENV === 'development') {
    //     return cb(null, true);
    //   }
      
    //   return cb(new Error('Not allowed by CORS'), false);
    // },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // allowedHeaders: [
    //   'Content-Type', 
    //   'Authorization', 
    //   'X-Requested-With',
    //   'Accept',
    //   'Origin',
    //   "User-Agent"
    // ],
    credentials: false,
  });

  // Socket.IO setup
  await fastify.register(fastifyIO, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Register core plugins
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);
  // await fastify.register(twitterPlugin);
  await fastify.register(fastifyOauth2, {
    name: 'twitterOAuth',
    credentials: {
      client: {
        id: process.env.TWITTER_API_KEY!,
        secret: process.env.TWITTER_API_SECRET_KEY!,
      },
      // auth: fastifyOauth2.TWITTER_CONFIGURATION,
      auth: {
        authorizeHost: 'https://api.twitter.com',
        authorizePath: '/oauth/authorize',
        tokenHost: 'https://api.twitter.com',
        tokenPath: '/oauth/access_token',
      },
    },
    startRedirectPath: '/auth/login',
    callbackUri: process.env.TWITTER_CALLBACK_URL!,
  });

  //Middleware to verify JWT
  const JWT_SECRET = config.jwt.secret;
  fastify.decorate('verifyJWT', async (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as import('./types').UserJwtPayload;
      request.user = decoded;
    } catch (error) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.register(fastifySession, {
    secret: JWT_SECRET,
    cookie: { secure: process.env.NODE_ENV == 'production' ? true : false }, // Set to true in production
  });

  fastify.register(fastifyMultipart, {
    // limits: {
    //   fieldNameSize: 100, // Max field name size in bytes
    //   fieldSize: 100,     // Max field value size in bytes
    //   fields: 10,         // Max number of non-file fields
    //   fileSize: 1000000,  // For multipart forms, the max file size in bytes
    //   files: 1,           // Max number of file fields
    //   headerPairs: 2000,  // Max number of header key=>value pairs
    //   parts: 1000         // For multipart forms, the max number of parts (fields + files)
    //   // fileSize: 1024 * 1024 * 15, // 15MB
    // },
  });

  // Register routes
  // Auth
  // await fastify.register(authRoutes);
  // Indexer
  console.log('Declaring routes');
  await declareRoutes(fastify);

  console.log('Initializing all cron jobs');
  // Initialize WebSocket handlers

  initCron(fastify);
  fastify.ready((err) => {
    if (err) throw err;
    setupWebSocket(fastify.io);
  });

  return fastify;
}

let server: any = null;

async function start() {
  try {
    server = await buildServer();
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

    await server.listen({
      port: config.server.port,
      host,
    });

    console.log(`Server listening on ${host}:${config.server.port}`);

    // Launch Telegram bot

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.IS_TELEGRAM_BOT_RUNNING === 'true') {
      try {
        await launchBot(process.env.TELEGRAM_BOT_TOKEN || '');
      } catch (error) {
        console.log('Error launching bot:', error);
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function shutdown() {
  console.log('Received shutdown signal');
  if (server) {
    try {
      await server.close();
      console.log('Server closed successfully');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGHUP', shutdown);

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  start();
}

export { buildServer };
