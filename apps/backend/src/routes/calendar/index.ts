import { FastifyInstance } from 'fastify';
import { GoogleCalendarService } from '../../services/googleCalendar.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const googleCalendarService = new GoogleCalendarService();

export default async function calendarRoutes(fastify: FastifyInstance) {
  // Get Google Calendar auth URL
  fastify.get('/google/auth-url', async (request, reply) => {
    try {
      const authUrl = googleCalendarService.generateAuthUrl();
      return { success: true, data: { authUrl } };
    } catch (error) {
      console.error('Error generating auth URL:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to generate auth URL' 
      });
    }
  });

  // Handle Google Calendar OAuth callback
  fastify.post('/google/callback', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { code } = request.body as { code: string };
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      // Exchange code for tokens
      const tokens = await googleCalendarService.getTokensFromCode(code);

      // Store tokens securely in database
      await googleCalendarService.storeTokens(userId, tokens);

      return { 
        success: true, 
        message: 'Google Calendar connected successfully' 
      };
    } catch (error) {
      console.error('Error handling Google callback:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to connect Google Calendar' 
      });
    }
  });

  // Check connection status with details
  fastify.get('/google/status', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const status = await googleCalendarService.getConnectionStatus(userId);
      return { success: true, data: status };
    } catch (error) {
      console.error('Error checking connection status:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to check connection status' 
      });
    }
  });

  // Refresh access token
  fastify.post('/google/refresh', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const success = await googleCalendarService.refreshAccessToken(userId);
      if (success) {
        return { success: true, message: 'Access token refreshed successfully' };
      } else {
        return reply.status(400).send({ 
          success: false, 
          error: 'Failed to refresh access token' 
        });
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to refresh access token' 
      });
    }
  });

  // Delete Google Calendar connection (secure deletion)
  fastify.delete('/google/disconnect', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const success = await googleCalendarService.deleteConnection(userId);
      if (success) {
        return { success: true, message: 'Google Calendar disconnected successfully' };
      } else {
        return reply.status(500).send({ 
          success: false, 
          error: 'Failed to disconnect Google Calendar' 
        });
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to disconnect Google Calendar' 
      });
    }
  });

  // Get user's calendars
  fastify.get('/calendars', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const calendars = await googleCalendarService.getCalendars(userId);
      return { success: true, data: calendars };
    } catch (error) {
      console.error('Error getting calendars:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to get calendars' 
      });
    }
  });

  // Create calendar event
  fastify.post('/events', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      const eventData = request.body as any;

      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const event = await googleCalendarService.createEvent(userId, eventData);
      return { success: true, data: event };
    } catch (error) {
      console.error('Error creating event:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to create event' 
      });
    }
  });

  // Get calendar events
  fastify.get('/events', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      const { timeMin, timeMax, maxResults } = request.query as any;

      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const events = await googleCalendarService.getEvents(userId, {
        timeMin,
        timeMax,
        maxResults: parseInt(maxResults) || 10
      });

      return { success: true, data: events };
    } catch (error) {
      console.error('Error getting events:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to get events' 
      });
    }
  });

  // Update calendar event
  fastify.put('/events/:eventId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      const { eventId } = request.params as { eventId: string };
      const eventData = request.body as any;

      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const event = await googleCalendarService.updateEvent(userId, eventId, eventData);
      return { success: true, data: event };
    } catch (error) {
      console.error('Error updating event:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to update event' 
      });
    }
  });

  // Delete calendar event
  fastify.delete('/events/:eventId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      const { eventId } = request.params as { eventId: string };

      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      await googleCalendarService.deleteEvent(userId, eventId);
      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      console.error('Error deleting event:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to delete event' 
      });
    }
  });

  // Get free/busy times
  fastify.post('/freebusy', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      const { timeMin, timeMax } = request.body as { timeMin: string; timeMax: string };

      if (!userId) {
        return reply.status(401).send({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const freeBusy = await googleCalendarService.getFreeBusy(userId, timeMin, timeMax);
      return { success: true, data: freeBusy };
    } catch (error) {
      console.error('Error getting free/busy:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to get free/busy times' 
      });
    }
  });
}