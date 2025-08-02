import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-encryption-key-32-chars-long';

  constructor() {
    // Use the backend URL for the redirect URI
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/calendar/google/callback';
    
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  }

  // Encrypt sensitive data before storing
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data after retrieving
  private decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipher('aes-256-cbc', this.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
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

  // Exchange authorization code for tokens and store securely
  async getTokensFromCode(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  }> {
    try {
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
    } catch (error) {
      console.error('Error getting tokens from code:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  // Store tokens securely in database
  async storeTokens(userId: string, tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  }): Promise<void> {
    try {
      // Encrypt sensitive tokens before storing
      const encryptedAccessToken = this.encrypt(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token ? this.encrypt(tokens.refresh_token) : null;

      await prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId,
            platform: 'google_calendar'
          }
        },
        update: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          updatedAt: new Date(),
          metadata: {
            lastTokenRefresh: new Date().toISOString(),
            tokenSource: 'oauth_flow'
          }
        },
        create: {
          userId,
          platform: 'google_calendar',
          accountId: 'primary',
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          metadata: {
            lastTokenRefresh: new Date().toISOString(),
            tokenSource: 'oauth_flow'
          }
        }
      });
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store tokens securely');
    }
  }

  // Get stored tokens and decrypt them
  private async getStoredTokens(userId: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  } | null> {
    try {
      const socialAccount = await prisma.socialAccount.findUnique({
        where: {
          userId_platform: {
            userId,
            platform: 'google_calendar'
          }
        }
      });

      if (!socialAccount?.accessToken) {
        return null;
      }

      // Decrypt tokens
      const decryptedAccessToken = this.decrypt(socialAccount.accessToken);
      const decryptedRefreshToken = socialAccount.refreshToken ? this.decrypt(socialAccount.refreshToken) : undefined;

      return {
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
        expiresAt: socialAccount.expiresAt || undefined
      };
    } catch (error) {
      console.error('Error retrieving stored tokens:', error);
      return null;
    }
  }

  // Create calendar client with user's tokens
  private async getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
    const tokens = await this.getStoredTokens(userId);
    
    if (!tokens?.accessToken) {
      throw new Error('Google Calendar not connected');
    }

    // Check if token is expired and refresh if needed
    if (tokens.expiresAt && tokens.expiresAt < new Date()) {
      if (!tokens.refreshToken) {
        throw new Error('Access token expired and no refresh token available');
      }
      
      // Refresh the token
      await this.refreshAccessToken(userId);
      
      // Get the refreshed tokens
      const refreshedTokens = await this.getStoredTokens(userId);
      if (!refreshedTokens?.accessToken) {
        throw new Error('Failed to refresh access token');
      }
      
      this.oauth2Client.setCredentials({
        access_token: refreshedTokens.accessToken,
        refresh_token: refreshedTokens.refreshToken,
        expiry_date: refreshedTokens.expiresAt?.getTime() || undefined
      });
    } else {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiresAt?.getTime() || undefined
      });
    }

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Refresh access token
  async refreshAccessToken(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getStoredTokens(userId);
      
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: tokens.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        // Store the refreshed tokens
        await this.storeTokens(userId, {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokens.refreshToken,
          expiry_date: credentials.expiry_date || undefined
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return false;
    }
  }

  // Delete Google Calendar connection
  async deleteConnection(userId: string): Promise<boolean> {
    try {
      // Revoke tokens with Google
      const tokens = await this.getStoredTokens(userId);
      if (tokens?.accessToken) {
        try {
          this.oauth2Client.setCredentials({
            access_token: tokens.accessToken
          });
          await this.oauth2Client.revokeCredentials();
        } catch (revokeError) {
          console.warn('Failed to revoke tokens with Google:', revokeError);
          // Continue with deletion even if revocation fails
        }
      }

      // Delete from database
      await prisma.socialAccount.deleteMany({
        where: {
          userId,
          platform: 'google_calendar'
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar connection:', error);
      return false;
    }
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

  // Check if user has Google Calendar connected
  async isConnected(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getStoredTokens(userId);
      return !!(tokens?.accessToken);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      return false;
    }
  }

  // Get connection status with details
  async getConnectionStatus(userId: string): Promise<{
    isConnected: boolean;
    lastSync?: string;
    expiresAt?: string;
    needsRefresh?: boolean;
  }> {
    try {
      const socialAccount = await prisma.socialAccount.findUnique({
        where: {
          userId_platform: {
            userId,
            platform: 'google_calendar'
          }
        }
      });

      if (!socialAccount) {
        return { isConnected: false };
      }

      const needsRefresh = socialAccount.expiresAt ? socialAccount.expiresAt < new Date() : false;

      return {
        isConnected: true,
        lastSync: socialAccount.updatedAt.toISOString(),
        expiresAt: socialAccount.expiresAt?.toISOString(),
        needsRefresh
      };
    } catch (error) {
      console.error('Error getting connection status:', error);
      return { isConnected: false };
    }
  }
} 