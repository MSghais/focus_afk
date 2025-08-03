import type { FastifyInstance } from 'fastify';

async function conversationRoutes(fastify: FastifyInstance) {
  // Test endpoint to verify the route is working
  fastify.get('/test', async (request, reply) => {
    return reply.send({ 
      message: 'Conversation route is working',
      timestamp: new Date().toISOString()
    });
  });

  // GET endpoint to retrieve signed URL for ElevenLabs conversation
  fastify.get('/signed-url', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      if (!userId) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }

      const agentId = process.env.ELEVENLABS_AGENT_ID;
      const apiKey = process.env.ELEVENLABS_API_KEY;

      if (!agentId || !apiKey) {
        return reply.code(500).send({ 
          message: 'ElevenLabs configuration missing',
          error: 'Agent ID or API key not configured'
        });
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
        {
          headers: {
            'xi-api-key': apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        throw new Error(`Failed to get signed URL: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      return reply.send({ 
        success: true,
        data: {
          signedUrl: data.signed_url,
        },
        message: 'Signed URL generated successfully'
      });

    } catch (error) {
      console.error('Error generating signed URL:', error);
      return reply.code(500).send({ 
        message: 'Failed to generate signed URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST endpoint to start a conversation session
  fastify.post('/start-session', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { sessionId, metadata } = request.body as { 
        sessionId?: string; 
        metadata?: Record<string, any> 
      };

      if (!userId) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }

      // Store conversation session in database if needed
      const session = await fastify.prisma.conversationSession.create({
        data: {
          userId,
          sessionId: sessionId || `session_${Date.now()}`,
          metadata: metadata || {},
          status: 'active',
          startedAt: new Date(),
        },
      });

      return reply.send({
        sessionId: session.sessionId,
        message: 'Conversation session started',
        session
      });

    } catch (error) {
      console.error('Error starting conversation session:', error);
      return reply.code(500).send({ 
        message: 'Failed to start conversation session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST endpoint to end a conversation session
  fastify.post('/end-session', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { sessionId } = request.body as { sessionId: string };

      if (!userId) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }

      if (!sessionId) {
        return reply.code(400).send({ message: 'Session ID is required' });
      }

      // Update conversation session status
      const session = await fastify.prisma.conversationSession.updateMany({
        where: {
          userId,
          sessionId,
          status: 'active'
        },
        data: {
          status: 'ended',
          endedAt: new Date(),
        },
      });

      return reply.send({
        message: 'Conversation session ended',
        sessionId
      });

    } catch (error) {
      console.error('Error ending conversation session:', error);
      return reply.code(500).send({ 
        message: 'Failed to end conversation session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default conversationRoutes; 