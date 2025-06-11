#!/usr/bin/env node

/**
 * Localhost Meta Ads Integration Test Script
 * Tests all major components of the Meta Ads application
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

// Test results storage
const testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

/**
 * Log with color and formatting
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Add test result
 */
function addResult(name, status, message, details = null) {
  testResults.totalTests++;
  if (status === 'passed') testResults.passed++;
  else if (status === 'failed') testResults.failed++;
  else if (status === 'warning') testResults.warnings++;
  
  testResults.details.push({
    name,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  });
  
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  const color = status === 'passed' ? 'green' : status === 'failed' ? 'red' : 'yellow';
  log(`${icon} ${name}: ${message}`, color);
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

/**
 * Make HTTP request
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, TIMEOUT);
    
    const req = http.request(options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    
    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    
    if (options.method === 'POST' && options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test 1: API Endpoint - /api/test-meta-complete
 */
async function testApiEndpoint() {
  log('\n🔍 Testing API Endpoint: /api/test-meta-complete', 'cyan');
  
  try {
    // Test without credentials (should handle gracefully)
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/test-meta-complete',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accessToken: 'test_token',
        adAccountId: 'act_test',
        datePreset: 'last_7d'
      })
    });
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(response.data);
        if (data.success) {
          addResult('API Endpoint', 'passed', 'Endpoint is accessible and responding correctly', 
            `Response time: ${data.report?.totalTime || 'N/A'}ms`);
        } else {
          addResult('API Endpoint', 'warning', 'Endpoint accessible but returned error', data.error);
        }
      } catch (e) {
        addResult('API Endpoint', 'warning', 'Endpoint accessible but response is not valid JSON', response.data);
      }
    } else {
      addResult('API Endpoint', 'failed', `Unexpected status code: ${response.status}`, response.data);
    }
  } catch (error) {
    addResult('API Endpoint', 'failed', 'Cannot connect to API endpoint', error.message);
  }
}

/**
 * Test 2: Dashboard Page - /dashboard
 */
async function testDashboard() {
  log('\n🔍 Testing Dashboard Page: /dashboard', 'cyan');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard',
      method: 'GET'
    });
    
    if (response.status === 200) {
      const hasReactRoot = response.data.includes('__next') || response.data.includes('_next');
      const hasMetaTags = response.data.includes('<meta') && response.data.includes('viewport');
      const hasTitle = response.data.includes('<title>');
      
      if (hasReactRoot && hasMetaTags && hasTitle) {
        addResult('Dashboard Page', 'passed', 'Dashboard loads successfully', 
          `Page size: ${(response.data.length / 1024).toFixed(2)}KB`);
      } else {
        addResult('Dashboard Page', 'warning', 'Dashboard loads but may be missing components',
          `React: ${hasReactRoot}, Meta tags: ${hasMetaTags}, Title: ${hasTitle}`);
      }
    } else if (response.status === 302 || response.status === 301) {
      addResult('Dashboard Page', 'warning', 'Dashboard redirects', 
        `Redirects to: ${response.headers.location}`);
    } else {
      addResult('Dashboard Page', 'failed', `Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    addResult('Dashboard Page', 'failed', 'Cannot access dashboard', error.message);
  }
}

/**
 * Test 3: Service Worker Registration
 */
async function testServiceWorker() {
  log('\n🔍 Testing Service Worker', 'cyan');
  
  try {
    // Check if service worker file exists
    const swResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/sw.js',
      method: 'GET'
    });
    
    if (swResponse.status === 200) {
      const hasServiceWorkerCode = swResponse.data.includes('self.addEventListener') || 
                                  swResponse.data.includes('workbox') ||
                                  swResponse.data.includes('service-worker');
      
      if (hasServiceWorkerCode) {
        addResult('Service Worker File', 'passed', 'Service worker file is accessible and valid',
          `File size: ${(swResponse.data.length / 1024).toFixed(2)}KB`);
      } else {
        addResult('Service Worker File', 'warning', 'Service worker file exists but may be empty or invalid');
      }
    } else {
      addResult('Service Worker File', 'failed', `Cannot access service worker file (status: ${swResponse.status})`);
    }
    
    // Check manifest.json
    const manifestResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/manifest.json',
      method: 'GET'
    });
    
    if (manifestResponse.status === 200) {
      try {
        const manifest = JSON.parse(manifestResponse.data);
        if (manifest.name && manifest.icons) {
          addResult('Web App Manifest', 'passed', 'Manifest file is valid',
            `App name: ${manifest.name}, Icons: ${manifest.icons.length}`);
        } else {
          addResult('Web App Manifest', 'warning', 'Manifest file exists but may be incomplete');
        }
      } catch (e) {
        addResult('Web App Manifest', 'warning', 'Manifest file exists but is not valid JSON');
      }
    } else {
      addResult('Web App Manifest', 'warning', 'No manifest file found (optional for PWA)');
    }
  } catch (error) {
    addResult('Service Worker', 'failed', 'Error testing service worker', error.message);
  }
}

/**
 * Test 4: Additional API Endpoints
 */
async function testAdditionalEndpoints() {
  log('\n🔍 Testing Additional API Endpoints', 'cyan');
  
  const endpoints = [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/meta', method: 'GET', name: 'Meta API Base' },
    { path: '/api/test-meta', method: 'GET', name: 'Test Meta Endpoint' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: endpoint.path,
        method: endpoint.method
      });
      
      if (response.status === 200) {
        addResult(endpoint.name, 'passed', `Endpoint is accessible (${endpoint.path})`);
      } else if (response.status === 405) {
        addResult(endpoint.name, 'warning', `Method not allowed for ${endpoint.path}`, 
          'Endpoint exists but may require different HTTP method');
      } else if (response.status === 401 || response.status === 403) {
        addResult(endpoint.name, 'warning', `Authentication required for ${endpoint.path}`);
      } else {
        addResult(endpoint.name, 'failed', `Status ${response.status} for ${endpoint.path}`);
      }
    } catch (error) {
      addResult(endpoint.name, 'failed', `Cannot access ${endpoint.path}`, error.message);
    }
  }
}

/**
 * Test 5: Static Assets
 */
async function testStaticAssets() {
  log('\n🔍 Testing Static Assets', 'cyan');
  
  const assets = [
    { path: '/placeholder-logo.svg', name: 'Logo SVG' },
    { path: '/icons/icon-192x192.svg', name: 'PWA Icon' }
  ];
  
  for (const asset of assets) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: asset.path,
        method: 'GET'
      });
      
      if (response.status === 200) {
        addResult(asset.name, 'passed', `Asset accessible: ${asset.path}`,
          `Size: ${(response.data.length / 1024).toFixed(2)}KB`);
      } else {
        addResult(asset.name, 'warning', `Asset not found: ${asset.path} (status: ${response.status})`);
      }
    } catch (error) {
      addResult(asset.name, 'failed', `Error accessing ${asset.path}`, error.message);
    }
  }
}

/**
 * Test 6: Check if server is running
 */
async function testServerStatus() {
  log('\n🔍 Testing Server Status', 'cyan');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    });
    
    if (response.status === 200 || response.status === 302) {
      addResult('Server Status', 'passed', 'Server is running and responding');
      
      // Check Next.js specific headers
      if (response.headers['x-powered-by'] && response.headers['x-powered-by'].includes('Next.js')) {
        addResult('Next.js Framework', 'passed', 'Next.js is properly configured');
      }
    } else {
      addResult('Server Status', 'warning', `Server responding with status ${response.status}`);
    }
  } catch (error) {
    addResult('Server Status', 'failed', 'Server is not accessible', error.message);
    log('\n❗ Make sure the server is running with: npm run dev', 'yellow');
    return false;
  }
  return true;
}

/**
 * Test using curl commands as fallback
 */
async function testWithCurl() {
  log('\n🔍 Running curl-based tests as fallback', 'cyan');
  
  try {
    // Test API endpoint with curl
    const { stdout: apiOutput } = await execPromise(
      `curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/api/test-meta-complete -H "Content-Type: application/json" -d '{"test": true}'`
    );
    
    if (apiOutput === '200') {
      addResult('Curl API Test', 'passed', 'API endpoint accessible via curl');
    } else {
      addResult('Curl API Test', 'warning', `API returned status ${apiOutput}`);
    }
    
    // Test dashboard with curl
    const { stdout: dashboardOutput } = await execPromise(
      `curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/dashboard`
    );
    
    if (dashboardOutput === '200') {
      addResult('Curl Dashboard Test', 'passed', 'Dashboard accessible via curl');
    } else {
      addResult('Curl Dashboard Test', 'warning', `Dashboard returned status ${dashboardOutput}`);
    }
  } catch (error) {
    addResult('Curl Tests', 'warning', 'Curl commands not available or failed', error.message);
  }
}

/**
 * Generate summary report
 */
function generateSummary() {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  
  const successRate = testResults.totalTests > 0 
    ? ((testResults.passed / testResults.totalTests) * 100).toFixed(1)
    : 0;
  
  log(`\nTotal Tests: ${testResults.totalTests}`);
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Warnings: ${testResults.warnings}`, testResults.warnings > 0 ? 'yellow' : 'green');
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 50 ? 'yellow' : 'red');
  
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.details
      .filter(t => t.status === 'failed')
      .forEach(t => log(`   - ${t.name}: ${t.message}`, 'red'));
  }
  
  if (testResults.warnings > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    testResults.details
      .filter(t => t.status === 'warning')
      .forEach(t => log(`   - ${t.name}: ${t.message}`, 'yellow'));
  }
  
  log('\n💡 Recommendations:', 'cyan');
  if (testResults.failed > 0) {
    log('   1. Ensure the server is running: npm run dev');
    log('   2. Check server logs for any errors');
    log('   3. Verify all environment variables are set');
  }
  if (testResults.warnings > 0) {
    log('   1. Review warning messages for potential issues');
    log('   2. Some warnings may be expected (e.g., auth required)');
  }
  if (successRate === '100.0') {
    log('   ✨ All tests passed! The Meta Ads integration appears to be working correctly.');
  }
  
  log('\n' + '='.repeat(60) + '\n', 'blue');
}

/**
 * Main test runner
 */
async function runTests() {
  log('🚀 Meta Ads Integration Test Suite', 'blue');
  log(`📍 Testing: ${BASE_URL}`, 'blue');
  log(`🕐 Started: ${new Date().toLocaleString()}`, 'blue');
  log('='.repeat(60), 'blue');
  
  // Check if server is running first
  const serverRunning = await testServerStatus();
  if (!serverRunning) {
    generateSummary();
    process.exit(1);
  }
  
  // Run all tests
  await testApiEndpoint();
  await testDashboard();
  await testServiceWorker();
  await testAdditionalEndpoints();
  await testStaticAssets();
  
  // Run curl tests as additional validation
  await testWithCurl();
  
  // Generate final report
  generateSummary();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run tests
runTests();