// scripts/integrated-load-test.js
// Using dynamic import for node-fetch
import('node-fetch').then(fetchModule => {
    const fetch = fetchModule.default;
    runLoadTest().catch(console.error);
  }).catch(console.error);
  
  // Configuration
  const BASE_URL = 'http://localhost:3000';
  const DURATION_MINUTES = 50; // Set to your desired test duration
  const DURATION_SECONDS = DURATION_MINUTES * 60;
  const MAX_CONCURRENCY = 20; // Maximum concurrency to reach
  const RAMP_UP_STAGES = 5; // Number of stages to ramp up
  const STAGE_DURATION_SECONDS = 120; // Duration of each ramp-up stage
  const LOGIN_TEST_PERCENTAGE = 20; // Percentage of requests that should be login tests (0-100)
  
  // Metrics collection
  const metrics = {
    requests: 0,
    errors: 0,
    statusCodes: {},
    endpoints: {},
    responseTimes: [],
    // Login specific metrics
    loginTests: {
      total: 0,
      successful: 0,
      failed: 0,
      errors: 0,
      scenarioCounts: {}
    }
  };
  
  // More diverse API paths with HTTP methods
  const API_ENDPOINTS = [
    { path: '/api/v1/users', method: 'GET' },
    { path: '/api/v2/users', method: 'GET' },
    { path: '/api/v1/memory-leak', method: 'GET' },
    { path: '/api/v2/memory-efficient', method: 'GET' },
    { path: '/api/v1/external-api', method: 'GET' },
    { path: '/api/v2/external-api', method: 'GET' },
    { path: '/api/v1/cpu-intensive', method: 'GET' },
    { path: '/api/v2/cpu-optimised', method: 'GET' },
    // { path: '/api/obs/sign-up', method: 'POST', payload: generateUserPayload }
  ];
  
  // Login test scenarios
  const LOGIN_SCENARIOS = [
    // Valid credentials
    { scenario: 'valid', username: 'test', password: 'password' },
    
    // Invalid credentials
    { scenario: 'wrong_password', username: 'test', password: 'wrongpassword' },
    { scenario: 'nonexistent_user', username: 'nonexistent', password: 'password' },
    
    // Missing fields
    { scenario: 'missing_password', username: 'test' },
    { scenario: 'missing_username', password: 'password' },
    { scenario: 'empty_credentials' },
    
    // Injection attempts
    { scenario: 'sql_injection', username: 'test\'; DROP TABLE users;--', password: 'password' },
    { scenario: 'xss_attempt', username: '<script>alert("XSS")</script>', password: 'password' }
  ];
  
  // Add login endpoint to API endpoints
  API_ENDPOINTS.push({ 
    path: '/api/v2/auth/login', 
    method: 'POST', 
    payload: () => {
      const scenario = LOGIN_SCENARIOS[Math.floor(Math.random() * LOGIN_SCENARIOS.length)];
      metrics.loginTests.scenarioCounts[scenario.scenario] = 
        (metrics.loginTests.scenarioCounts[scenario.scenario] || 0) + 1;
      return scenario;
    },
    isLoginTest: true
  });
  
  // Random delay between min and max ms
  const randomDelay = (min, max) => 
    new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
  
  // Generate random user data for POST requests
  function generateUserPayload() {
    const userId = Math.floor(Math.random() * 10000);
    return {
      name: `User${userId}`,
      email: `user${userId}@test.com`,
      age: 20 + Math.floor(Math.random() * 40),
      signupDate: new Date().toISOString()
    };
  }
  
  // Call an API endpoint
  async function callEndpoint(endpoint) {
    const { path, method, payload, isLoginTest } = endpoint;
    const requestOptions = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (method !== 'GET' && payload) {
      requestOptions.body = JSON.stringify(typeof payload === 'function' ? payload() : payload);
    }
    
    const start = Date.now();
    try {
      const response = await fetch(`${BASE_URL}${path}`, requestOptions);
      const duration = Date.now() - start;
      let responseData;
      
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = await response.text();
      }
      
      // Update metrics
      metrics.requests++;
      metrics.responseTimes.push(duration);
      metrics.statusCodes[response.status] = (metrics.statusCodes[response.status] || 0) + 1;
      
      if (!metrics.endpoints[path]) {
        metrics.endpoints[path] = { 
          count: 0, 
          errors: 0, 
          totalTime: 0, 
          min: Infinity, 
          max: 0 
        };
      }
      
      const endpointMetric = metrics.endpoints[path];
      endpointMetric.count++;
      endpointMetric.totalTime += duration;
      endpointMetric.min = Math.min(endpointMetric.min, duration);
      endpointMetric.max = Math.max(endpointMetric.max, duration);
      
      // Track login test metrics if applicable
      if (isLoginTest) {
        metrics.loginTests.total++;
        
        if (response.status === 200) {
          metrics.loginTests.successful++;
        } else if (response.status === 401) {
          metrics.loginTests.failed++;
        } else {
          metrics.loginTests.errors++;
        }
      }
      
      // Log with more details
      console.log(`${method} ${path} - ${response.status} - ${duration}ms${isLoginTest ? ' [LOGIN TEST]' : ''}`);
      
      // Attempt to parse response only if needed
      if (response.ok) {
        return { success: true, duration, status: response.status, data: responseData };
      } else {
        metrics.errors++;
        endpointMetric.errors++;
        console.error(`Error response ${path}: ${response.status}`);
        return { success: false, duration, status: response.status, error: responseData };
      }
    } catch (error) {
      const duration = Date.now() - start;
      metrics.errors++;
      
      if (!metrics.endpoints[path]) {
        metrics.endpoints[path] = { count: 0, errors: 0, totalTime: 0, min: Infinity, max: 0 };
      }
      metrics.endpoints[path].errors++;
      
      // Update login metrics if needed
      if (isLoginTest) {
        metrics.loginTests.total++;
        metrics.loginTests.errors++;
      }
      
      console.error(`Network error calling ${method} ${path}:`, error.message);
      return { success: false, duration, error: error.message };
    }
  }
  
  // Run a worker that continuously calls endpoints
  async function runWorker(workerId) {
    console.log(`Worker ${workerId} started`);
    
    const endTime = Date.now() + (DURATION_SECONDS * 1000);
    
    while (Date.now() < endTime) {
      let endpoint;
      
      // Determine if this request should be a login test based on configured percentage
      const isLoginTest = Math.random() * 100 < LOGIN_TEST_PERCENTAGE;
      
      if (isLoginTest) {
        // Find the login endpoint
        endpoint = API_ENDPOINTS.find(e => e.isLoginTest);
      } else {
        // Filter out login tests for normal operation
        const regularEndpoints = API_ENDPOINTS.filter(e => !e.isLoginTest);
        endpoint = regularEndpoints[Math.floor(Math.random() * regularEndpoints.length)];
      }
      
      await callEndpoint(endpoint);
      
      // Random delay between requests (variable pattern to simulate real traffic)
      if (Math.random() < 0.1) {
        // Occasionally have longer pauses
        await randomDelay(1000, 3000);
      } else {
        await randomDelay(50, 500);
      }
    }
    
    console.log(`Worker ${workerId} finished`);
  }
  
  // Create ramp-up pattern with different stages
  async function rampUpTraffic() {
    const baseUsers = Math.floor(MAX_CONCURRENCY / RAMP_UP_STAGES);
    const workers = [];
    
    for (let stage = 1; stage <= RAMP_UP_STAGES; stage++) {
      const concurrentUsers = baseUsers * stage;
      console.log(`Ramping up to ${concurrentUsers} concurrent users (Stage ${stage}/${RAMP_UP_STAGES})`);
      
      // Launch new workers for this stage
      for (let i = workers.length; i < concurrentUsers; i++) {
        workers.push(runWorker(i));
      }
      
      // Wait for this stage duration before ramping up more
      await new Promise(r => setTimeout(r, STAGE_DURATION_SECONDS * 1000));
      
      // Log intermediate metrics
      logMetrics(`Stage ${stage} completed`);
    }
    
    // Wait for all workers to complete
    await Promise.all(workers);
  }
  
  // Log metrics data periodically
  function startMetricsLogger() {
    const intervalId = setInterval(() => {
      logMetrics('Periodic report');
    }, 60000); // Log every minute
    
    // Stop the interval when the test ends
    setTimeout(() => {
      clearInterval(intervalId);
    }, DURATION_SECONDS * 1000);
  }
  
  // Log detailed metrics
  function logMetrics(label) {
    if (metrics.requests === 0) return;
    
    // Calculate summary statistics
    const avgResponseTime = metrics.responseTimes.reduce((sum, time) => sum + time, 0) / metrics.responseTimes.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`METRICS REPORT: ${label}`);
    console.log('='.repeat(50));
    console.log(`Total Requests: ${metrics.requests}`);
    console.log(`Total Errors: ${metrics.errors} (${((metrics.errors / metrics.requests) * 100).toFixed(2)}%)`);
    console.log(`Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    // Sort and display endpoint performance
    console.log('\nEndpoint Performance:');
    Object.entries(metrics.endpoints).forEach(([path, data]) => {
      console.log(`  ${path}:`);
      console.log(`    Count: ${data.count}`);
      console.log(`    Errors: ${data.errors}`);
      console.log(`    Avg Time: ${(data.totalTime / data.count).toFixed(2)}ms`);
      console.log(`    Min/Max: ${data.min}ms / ${data.max}ms`);
    });
    
    // Status code distribution
    console.log('\nStatus Code Distribution:');
    Object.entries(metrics.statusCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count} (${((count / metrics.requests) * 100).toFixed(2)}%)`);
    });
    
    // Login test specific metrics
    if (metrics.loginTests.total > 0) {
      console.log('\nLogin Test Metrics:');
      console.log(`  Total Login Tests: ${metrics.loginTests.total}`);
      console.log(`  Successful Logins: ${metrics.loginTests.successful}`);
      console.log(`  Failed Logins: ${metrics.loginTests.failed}`);
      console.log(`  Errors: ${metrics.loginTests.errors}`);
      
      console.log('\nLogin Test Scenarios:');
      Object.entries(metrics.loginTests.scenarioCounts).forEach(([scenario, count]) => {
        console.log(`  ${scenario}: ${count} tests`);
      });
    }
    
    console.log('='.repeat(50) + '\n');
  }
  
  // Export metrics to a file for Grafana
  function exportMetrics() {
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const fileName = `load-test-results-${timestamp}.json`;
    
    const exportData = {
      config: {
        duration: DURATION_SECONDS,
        maxConcurrency: MAX_CONCURRENCY,
        baseUrl: BASE_URL,
        loginTestPercentage: LOGIN_TEST_PERCENTAGE
      },
      results: {
        ...metrics,
        summary: {
          totalRequests: metrics.requests,
          totalErrors: metrics.errors,
          errorRate: metrics.requests ? (metrics.errors / metrics.requests) : 0,
          avgResponseTime: metrics.responseTimes.length 
            ? metrics.responseTimes.reduce((sum, time) => sum + time, 0) / metrics.responseTimes.length 
            : 0
        }
      },
      timestamp: new Date().toISOString(),
      testDuration: `${DURATION_MINUTES} minutes`
    };
    
    fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
    console.log(`Results exported to ${fileName}`);
  }
  
  // Main function to start the load test
  async function runLoadTest() {
    console.log(`Starting integrated load test for ${DURATION_MINUTES} minutes`);
    console.log(`Login tests will be approximately ${LOGIN_TEST_PERCENTAGE}% of total traffic`);
    
    // Start metrics logger
    startMetricsLogger();
    
    // Begin with ramp-up pattern
    await rampUpTraffic();
    
    // Maintain load for the remaining duration
    const remainingTime = DURATION_SECONDS - (RAMP_UP_STAGES * STAGE_DURATION_SECONDS);
    
    if (remainingTime > 0) {
      console.log(`Maintaining peak load of ${MAX_CONCURRENCY} users for ${Math.floor(remainingTime / 60)} minutes`);
      
      // Wait for the remaining test duration
      await new Promise(r => setTimeout(r, remainingTime * 1000));
    }
    
    // Log final metrics
    logMetrics('Final Results');
    
    // Export metrics to file
    exportMetrics();
    
    console.log('Load test completed');
  }