#!/usr/bin/env node

// Debug script to test OAuth configuration
require('dotenv').config();
const { google } = require('googleapis');

console.log('🔍 Debugging OAuth Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI || 'NOT SET'}`);
console.log(`ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? `${process.env.ENCRYPTION_KEY.length} chars` : 'NOT SET'}`);

// Test OAuth client creation
console.log('\n🔧 Testing OAuth Client:');
try {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  console.log('✅ OAuth client created successfully');
  
  // Generate auth URL to test
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    prompt: 'consent'
  });
  
  console.log('✅ Auth URL generated successfully');
  console.log(`Auth URL: ${authUrl.substring(0, 100)}...`);
  
} catch (error) {
  console.log('❌ Error creating OAuth client:', error.message);
}

console.log('\n🔍 Common Issues & Solutions:');
console.log('1. ❌ invalid_grant error:');
console.log('   - Check Google Cloud Console → Credentials → OAuth 2.0 Client ID');
console.log('   - Authorized redirect URIs should contain: http://localhost:3000/auth/google/callback');
console.log('   - Remove any other redirect URIs (like localhost:5000)');
console.log('');
console.log('2. 🔧 Google Cloud Console Steps:');
console.log('   - Go to: https://console.cloud.google.com/');
console.log('   - Navigate to: APIs & Services → Credentials');
console.log('   - Find your OAuth 2.0 Client ID');
console.log('   - Click "Edit" (pencil icon)');
console.log('   - In "Authorized redirect URIs" add: http://localhost:3000/auth/google/callback');
console.log('   - Remove any other redirect URIs');
console.log('   - Click "Save"');
console.log('');
console.log('3. 🧪 After fixing, restart your backend and try again');

console.log('\n📝 Current Configuration Summary:');
console.log(`- Client ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Valid format' : '❌ Missing'}`);
console.log(`- Redirect URI: ${process.env.GOOGLE_REDIRECT_URI === 'http://localhost:3000/auth/google/callback' ? '✅ Correct' : '❌ Wrong'}`);
console.log(`- Encryption Key: ${process.env.ENCRYPTION_KEY?.length === 32 ? '✅ Valid length' : '❌ Wrong length'}`); 