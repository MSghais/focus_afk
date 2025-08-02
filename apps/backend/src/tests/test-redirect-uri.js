#!/usr/bin/env node

// Test to verify redirect URI configuration
require('dotenv').config();
const { google } = require('googleapis');

console.log('🔍 Testing Redirect URI Configuration...\n');

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

console.log('📋 Current Configuration:');
console.log(`Client ID: ${clientId}`);
console.log(`Redirect URI: ${redirectUri}`);
console.log(`Client Secret: ${clientSecret ? 'SET' : 'NOT SET'}`);

console.log('\n🔧 Expected Configuration:');
console.log('In Google Cloud Console, your OAuth 2.0 Client should have:');
console.log(`Authorized redirect URIs: ${redirectUri}`);

console.log('\n⚠️ Common Issues:');
console.log('1. Redirect URI in Google Console is different from your .env file');
console.log('2. Multiple redirect URIs in Google Console (remove old ones)');
console.log('3. Wrong OAuth Client ID (you have multiple clients)');

console.log('\n🔗 Google Cloud Console Steps:');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('2. Navigate to: APIs & Services → Credentials');
console.log(`3. Find OAuth Client: ${clientId}`);
console.log('4. Click "Edit" (pencil icon)');
console.log('5. In "Authorized redirect URIs":');
console.log(`   - Add: ${redirectUri}`);
console.log('   - Remove any other URIs');
console.log('6. Click "Save"');

console.log('\n✅ After fixing, restart your backend and try again!'); 