#!/usr/bin/env node

// Check which OAuth Client ID to use
require('dotenv').config();

console.log('🔍 Checking OAuth Client ID Configuration...\n');

const currentClientId = process.env.GOOGLE_CLIENT_ID;

console.log('📋 Current Configuration:');
console.log(`Current Client ID: ${currentClientId}`);

console.log('\n🔧 You have two OAuth Client IDs:');
console.log('1. OLD: 439260610001-9oikd3v96q13o10nugost3oc5b38hdme.apps.googleusercontent.com');
console.log('2. NEW: 439260610001-bc4g36rbrt56cm9u970cpelo13abgnj3.apps.googleusercontent.com');

console.log('\n🎯 Current Status:');
if (currentClientId.includes('bc4g36rbrt56cm9u970cpelo13abgnj3')) {
  console.log('✅ Using NEW Client ID');
  console.log('⚠️ Make sure NEW Client ID in Google Cloud Console has:');
  console.log('   Redirect URI: http://localhost:3000/auth/google/callback');
} else if (currentClientId.includes('9oikd3v96q13o10nugost3oc5b38hdme')) {
  console.log('✅ Using OLD Client ID');
  console.log('⚠️ Make sure OLD Client ID in Google Cloud Console has:');
  console.log('   Redirect URI: http://localhost:3000/auth/google/callback');
} else {
  console.log('❌ Unknown Client ID');
}

console.log('\n🔗 Google Cloud Console Steps:');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('2. Navigate to: APIs & Services → Credentials');
console.log(`3. Find OAuth Client: ${currentClientId}`);
console.log('4. Click "Edit" (pencil icon)');
console.log('5. In "Authorized redirect URIs":');
console.log('   - Add: http://localhost:3000/auth/google/callback');
console.log('   - Remove any other URIs');
console.log('6. Click "Save"');

console.log('\n💡 Recommendation:');
console.log('- Use the NEW Client ID (bc4g36rbrt56cm9u970cpelo13abgnj3)');
console.log('- Make sure it has the correct redirect URI');
console.log('- Remove the OLD Client ID to avoid confusion'); 