// scripts/load-test.js
// Using dynamic import for node-fetch
import('node-fetch').then(fetchModule => {
  const fetch = fetchModule.default;
}).catch(console.error);

// Configuration
const BASE_URL = 'http://localhost:3000';
const DURATION_SECONDS = 300; // 5 minutes test
const CONCURRENCY = 5;
const API_PATHS = [
  '/api/v1/users',
  '/api/v2/users',
  '/api/v1/memory-leak',
  '/api/v2/memory-efficient',
  '/api/v1/external-api',
  '/api/v2/external-api',
  '/api/v1/cpu-intensive',
  '/api/v2/cpu-optimised'
];

// Random delay between min and max ms
const randomDelay = (min, max) => 
  new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

// Add random payloads for POST requests
const generateUserPayload = () => ({
  name: `User${Math.floor(Math.random() * 1000)}`,
  email: `user${Math.floor(Math.random() * 1000)}@test.com`
});

// Add ramp-up pattern
async function rampUpTraffic() {
  for(let i = 1; i <= 5; i++) {
    console.log(`Ramping up to ${i*2} concurrent users`);
    await runConcurrentUsers(i*2);
    await new Promise(r => setTimeout(r, 60000)); // 1 min per stage
  }
}

// Call an API endpoint
async function callEndpoint(path) {
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}${path}`);
    const data = await response.json();
    const duration = Date.now() - start;
    
    console.log(`${path} - ${response.status} - ${duration}ms`);
    return { success: response.ok, duration, status: response.status };
  } catch (error) {
    console.error(`Error calling ${path}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Run a worker that continuously calls endpoints
async function runWorker(workerId) {
  console.log(`Worker ${workerId} started`);
  
  const endTime = Date.now() + (DURATION_SECONDS * 1000);
  
  while (Date.now() < endTime) {
    // Pick a random API path
    const path = API_PATHS[Math.floor(Math.random() * API_PATHS.length)];
    
    await callEndpoint(path);
    
    // Random delay between requests
    await randomDelay(100, 2000);
  }
  
  console.log(`Worker ${workerId} finished`);
}

// Main function to start the load test
async function runLoadTest() {
  console.log(`Starting load test with ${CONCURRENCY} concurrent users for ${DURATION_SECONDS} seconds`);
  
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(runWorker(i));
  }
}

runLoadTest().catch(console.error);

