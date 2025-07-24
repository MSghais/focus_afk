const fetch = require('node-fetch');

const BACKEND_URL = process.env.BACKEND_URL || 'https://focus-afk-backend.up.railway.app';

async function testCors() {
  console.log('Testing CORS configuration...');
  console.log('Backend URL:', BACKEND_URL);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Origin': 'https://focus.afk-community.xyz',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Health endpoint status:', healthResponse.status);
    console.log('Health endpoint headers:', Object.fromEntries(healthResponse.headers.entries()));
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health endpoint data:', healthData);
    }
    
    // Test CORS endpoint
    console.log('\n2. Testing CORS test endpoint...');
    const corsResponse = await fetch(`${BACKEND_URL}/auth/test-cors`, {
      method: 'GET',
      headers: {
        'Origin': 'https://focus.afk-community.xyz',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('CORS test endpoint status:', corsResponse.status);
    console.log('CORS test endpoint headers:', Object.fromEntries(corsResponse.headers.entries()));
    
    if (corsResponse.ok) {
      const corsData = await corsResponse.json();
      console.log('CORS test endpoint data:', corsData);
    }
    
    // Test preflight request
    console.log('\n3. Testing preflight request...');
    const preflightResponse = await fetch(`${BACKEND_URL}/auth/evm-login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://focus.afk-community.xyz',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    
    console.log('Preflight status:', preflightResponse.status);
    console.log('Preflight headers:', Object.fromEntries(preflightResponse.headers.entries()));
    
  } catch (error) {
    console.error('Error testing CORS:', error);
  }
}

testCors(); 