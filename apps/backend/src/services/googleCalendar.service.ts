import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    );
  }

  // Generate authorization URL
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    // Ensure we have the required access_token
    if (!tokens.access_token) {
      throw new Error('Failed to get access token from Google');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined
    };
  }

  // Create calendar client with user's tokens
  private async getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { socialAccounts: true }
    });

    const googleAccount = user?.socialAccounts.find(
      account => account.platform === 'google_calendar'
    );

    if (!googleAccount?.accessToken) {
      throw new Error('Google Calendar not connected');
    }

    this.oauth2Client.setCredentials({
      access_token: googleAccount.accessToken,
      refresh_token: googleAccount.refreshToken || undefined,
      expiry_date: googleAccount.expiresAt?.getTime()
    });

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Get user's calendars
  async getCalendars(userId: string): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  }

  // Create calendar event
  async createEvent(userId: string, eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: { email: string }[];
    reminders?: { useDefault: boolean };
  }): Promise<calendar_v3.Schema$Event> {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData
    });

    return response.data;
  }

  // Get calendar events
  async getEvents(userId: string, options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: string;
  } = {}): Promise<calendar_v3.Schema$Event[]> {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax,
      maxResults: options.maxResults || 10,
      singleEvents: options.singleEvents || true,
      orderBy: options.orderBy || 'startTime'
    });

    return response.data.items || [];
  }

  // Update calendar event
  async updateEvent(userId: string, eventId: string, eventData: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: eventData
    });

    return response.data;
  }

  // Delete calendar event
  async deleteEvent(userId: string, eventId: string): Promise<{ success: boolean }> {
    const calendar = await this.getCalendarClient(userId);
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });

    return { success: true };
  }

  // Check calendar availability
  async getFreeBusy(userId: string, timeMin: string, timeMax: string): Promise<calendar_v3.Schema$FreeBusyResponse> {
    const calendar = await this.getCalendarClient(userId);
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }]
      }
    });

    return response.data;
  }

  // Refresh access token if expired
  async refreshAccessToken(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { socialAccounts: true }
      });

      const googleAccount = user?.socialAccounts.find(
        account => account.platform === 'google_calendar'
      );

      if (!googleAccount?.refreshToken) {
        throw new Error('No refresh token available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: googleAccount.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        // Update the stored tokens
        await prisma.socialAccount.update({
          where: { id: googleAccount.id },
          data: {
            accessToken: credentials.access_token,
            expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            updatedAt: new Date()
          }
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return false;
    }
  }

  // Check if user has Google Calendar connected
  async isConnected(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { socialAccounts: true }
      });

      const googleAccount = user?.socialAccounts.find(
        account => account.platform === 'google_calendar'
      );

      return !!(googleAccount?.accessToken);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      return false;
    }
  }

  // Disconnect Google Calendar
  async disconnect(userId: string): Promise<boolean> {
    try {
      await prisma.socialAccount.deleteMany({
        where: {
          userId,
          platform: 'google_calendar'
        }
      });

      return true;
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      return false;
    }
  }
} 