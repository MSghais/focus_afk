# Google Calendar Integration Setup Guide

## 🔐 Security Features

This implementation includes several security measures:

1. **Token Encryption**: All access and refresh tokens are encrypted using AES-256-CBC before storage
2. **Automatic Token Refresh**: Tokens are automatically refreshed when expired
3. **Secure Deletion**: Tokens are properly revoked with Google before deletion
4. **User Isolation**: Each user's tokens are isolated and encrypted separately

## 📋 Prerequisites

1. **Google Cloud Project** with Calendar API enabled
2. **OAuth 2.0 Credentials** configured
3. **Environment Variables** set up
4. **Database Migration** completed

## 🔧 Setup Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     http://localhost:5000/calendar/google/callback
     https://yourdomain.com/calendar/google/callback
     ```
   - Click "Create"
   - Save the **Client ID** and **Client Secret**

5. Configure OAuth Consent Screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Add your email as a test user (for development)
   - Set app name: "Focus AFK"
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/calendar.readonly`

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_REDIRECT_URI="http://localhost:5000/calendar/google/callback"

# Security - Generate a strong encryption key
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Your existing variables...
BACKEND_DATABASE_URL="your_database_url"
```

### 3. Generate Encryption Key

Generate a secure 32-character encryption key:

```bash
# Option 1: Using OpenSSL
openssl rand -hex 16

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Option 3: Online generator (for development only)
# https://generate-secret.vercel.app/32
```

### 4. Database Migration

The existing `SocialAccount` model already supports token storage. No additional migration is needed.

### 5. Install Dependencies

```bash
cd apps/backend
npm install googleapis google-auth-library
```

## 🚀 Usage

### Frontend Integration

The integration provides these features:

1. **Connect Calendar**: OAuth flow to connect Google Calendar
2. **View Calendars**: List all accessible calendars
3. **View Events**: Browse calendar events with date filtering
4. **Save Events as Tasks**: Convert calendar events to Focus AFK tasks
5. **Sync Tasks to Calendar**: Add Focus AFK tasks to Google Calendar
6. **Token Management**: Automatic refresh and secure deletion

### API Endpoints

- `GET /calendar/google/auth-url` - Get OAuth URL
- `POST /calendar/google/callback` - Handle OAuth callback
- `GET /calendar/google/status` - Get connection status
- `POST /calendar/google/refresh` - Refresh access token
- `DELETE /calendar/google/disconnect` - Disconnect calendar
- `GET /calendar/calendars` - Get user's calendars
- `GET /calendar/events` - Get calendar events
- `POST /calendar/events` - Create calendar event
- `PUT /calendar/events/:id` - Update calendar event
- `DELETE /calendar/events/:id` - Delete calendar event

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **Encryption Key**: Use a strong, unique encryption key
3. **Token Expiration**: Tokens are automatically refreshed
4. **User Isolation**: Each user's tokens are encrypted separately
5. **Secure Deletion**: Tokens are revoked with Google before deletion

## 🐛 Troubleshooting

### Common Issues

1. **"OAuth client was not found"**
   - Check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Verify redirect URIs match exactly

2. **"Access blocked"**
   - Add your email as a test user in OAuth consent screen
   - Check if the app is in testing mode

3. **"Token expired"**
   - Tokens are automatically refreshed
   - If refresh fails, reconnect the calendar

4. **"Encryption error"**
   - Check your `ENCRYPTION_KEY` is 32 characters
   - Ensure the key is consistent across deployments

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=googleapis:*
```

## 📱 User Experience

Users can:

1. **Connect** their Google Calendar with one click
2. **View** all their calendars and events
3. **Import** calendar events as tasks
4. **Sync** their Focus AFK tasks to calendar
5. **Manage** their connection securely
6. **Disconnect** at any time with proper token revocation

## 🔄 Token Lifecycle

1. **Initial Connection**: User authorizes → tokens encrypted and stored
2. **Usage**: Tokens decrypted for API calls
3. **Expiration**: Tokens automatically refreshed
4. **Disconnection**: Tokens revoked with Google and deleted from database

This implementation provides a secure, user-friendly Google Calendar integration that respects user privacy and follows OAuth 2.0 best practices. 