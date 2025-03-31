// test-login.js
import('node-fetch').then(fetchModule => {
    const fetch = fetchModule.default;
  }).catch(console.error);

// Configuration
const API_URL = 'http://localhost:3000/api/v2/auth/login'; // Adjust based on your server setup
const TEST_ITERATIONS = 1000;
const DELAY_BETWEEN_REQUESTS_MS = 100;

// Test scenarios
const testScenarios = [
  // Valid credentials
  { username: 'test', password: 'password' },
  
  // Invalid credentials
  { username: 'test', password: 'wrongpassword' },
  { username: 'nonexistent', password: 'password' },
  
  // Missing fields
  { username: 'test' },
  { password: 'password' },
  { },
  
  // Random injection attempts
  { username: 'test\'; DROP TABLE users;--', password: 'password' },
  { username: '<script>alert("XSS")</script>', password: 'password' }
];

// Function to send a request
async function sendLoginRequest(payload) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    console.log({
      timestamp: new Date().toISOString(),
      status: response.status,
      payload,
      response: data
    });
    
    return { status: response.status, data };
  } catch (error) {
    console.error('Request failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

// Function to run all tests
async function runTests() {
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: 0
  };
  
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    // Pick a random scenario
    const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
    
    console.log(`Test #${i+1}/${TEST_ITERATIONS}: Sending request with payload:`, scenario);
    
    const result = await sendLoginRequest(scenario);
    results.total++;
    
    if (result.status === 200) {
      results.successful++;
    } else if (result.status === 401) {
      results.failed++;
    } else {
      results.errors++;
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS_MS));
  }
  
  // Print summary
  console.log('\n--- Test Summary ---');
  console.log(`Total requests: ${results.total}`);
  console.log(`Successful logins: ${results.successful}`);
  console.log(`Failed logins: ${results.failed}`);
  console.log(`Errors: ${results.errors}`);
}

// Run the tests
console.log('Starting login endpoint tests...');
runTests()
  .then(() => console.log('Tests completed'))
  .catch(err => console.error('Test suite failed:', err));