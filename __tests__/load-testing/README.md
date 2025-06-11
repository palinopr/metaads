# Performance Testing & Load Testing Suite

Comprehensive performance testing infrastructure for the Meta Ads Dashboard, designed to ensure scalability, reliability, and optimal user experience under various load conditions.

## 🎯 Overview

This testing suite provides comprehensive coverage of:

- **Authentication System Load Testing** - Multi-user authentication flows, session management, and security under load
- **API Performance Testing** - All endpoints, rate limiting, and data throughput validation  
- **WebSocket Real-time Testing** - Connection scaling, message throughput, and real-time feature performance
- **Database & Caching Performance** - Data operations, query optimization, and cache efficiency
- **Browser Performance Testing** - Front-end responsiveness, Core Web Vitals, and cross-browser compatibility
- **Memory Leak Detection** - Long-running session analysis and memory optimization validation
- **CI/CD Integration** - Automated performance testing in deployment pipelines

## 📋 Test Suite Components

### 1. Authentication Load Testing (`auth-load-test.js`)
**Purpose**: Tests authentication system under various load conditions

**Key Scenarios**:
- Normal authentication load (25-50 concurrent users)
- Authentication spike testing (sudden surge to 200 users)
- Session management stress testing (100 concurrent sessions)
- Rate limiting validation and recovery
- Token refresh under load
- CSRF protection performance

**Key Metrics**:
- `auth_response_time`: Authentication endpoint response times
- `session_creation_time`: Session establishment performance
- `token_validation_time`: Token processing speed
- `rate_limit_hits`: Rate limiting encounter frequency
- `auth_success_rate`: Authentication success percentage

### 2. API Comprehensive Load Testing (`api-comprehensive-load-test.js`)
**Purpose**: Tests all API endpoints under various load patterns

**Key Scenarios**:
- Baseline API performance validation
- Meta API intensive testing (Facebook Graph API)
- Real-time features stress testing
- AI processing load validation
- Mixed API simulation (realistic usage patterns)
- Rate limit validation across endpoints

**Key Metrics**:
- `api_response_time`: Overall API response performance
- `meta_api_response_time`: Facebook API integration performance
- `api_throughput`: Request processing rate
- `api_error_rate`: API failure percentage
- `concurrent_requests`: Peak concurrent request handling

### 3. WebSocket Performance Testing (`websocket-load-test.js`)
**Purpose**: Tests real-time WebSocket connections at scale

**Key Scenarios**:
- Connection scaling (10 to 200+ concurrent connections)
- High-frequency message testing
- Subscription stress testing
- Connection resilience and recovery
- Real-time data flow simulation

**Key Metrics**:
- `ws_connection_time`: WebSocket connection establishment time
- `ws_message_latency`: Message round-trip latency
- `concurrent_connections`: Peak concurrent WebSocket connections
- `messages_throughput`: Message processing rate
- `connection_drops`: Unexpected connection failures

### 4. Database & Cache Performance Testing (`database-cache-performance-test.js`)
**Purpose**: Tests data storage, retrieval, and caching mechanisms

**Key Scenarios**:
- Cache performance baseline and heavy load
- Data retrieval stress testing
- Concurrent database operations
- Cache invalidation patterns
- Large dataset operations

**Key Metrics**:
- `cache_hit_rate`: Cache effectiveness percentage
- `data_retrieval_time`: Database query performance
- `bulk_operation_time`: Large dataset processing time
- `query_execution_time`: Database query optimization
- `data_consistency`: Data accuracy under load

### 5. Browser Performance Testing (`browser-performance-test.js`)
**Purpose**: Tests front-end performance and user experience

**Key Scenarios**:
- Page load performance across browsers
- UI interaction responsiveness
- Resource loading optimization
- Data visualization rendering
- Mobile performance validation
- Accessibility compliance testing

**Key Metrics**:
- `first_contentful_paint`: FCP - Time to first visible content
- `largest_contentful_paint`: LCP - Largest element render time
- `cumulative_layout_shift`: CLS - Visual stability score
- `time_to_interactive`: TTI - Interactive readiness
- `click_response_time`: UI interaction responsiveness

### 6. Memory Leak Detection Testing (`memory-leak-detection-test.js`)
**Purpose**: Tests memory usage patterns and leak detection

**Key Scenarios**:
- Sustained memory monitoring
- Memory stress testing with intensive operations
- Long-running session simulation (30-60 minutes)
- Memory cleanup validation
- Memory fragmentation analysis

**Key Metrics**:
- `heap_usage_mb`: Memory consumption tracking
- `memory_leak_severity`: Leak detection scoring (1-5 scale)
- `heap_growth_rate`: Memory growth over time
- `resource_cleanup_efficiency`: Resource management effectiveness
- `performance_degradation_score`: Memory-related performance impact

## 🚀 Quick Start

### Prerequisites

1. **K6 Installation** (Load Testing Tool)
```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

2. **Node.js Dependencies**
```bash
npm install
```

3. **Application Running**
```bash
npm start
# Application should be running on http://localhost:3000
```

### Running Individual Test Suites

```bash
# Navigate to test directory
cd __tests__/load-testing

# Authentication load testing
k6 run --duration 5m --vus 25 auth-load-test.js

# API comprehensive testing
k6 run --duration 10m --vus 50 api-comprehensive-load-test.js

# WebSocket performance testing
k6 run --duration 8m --vus 30 websocket-load-test.js

# Database and cache testing
k6 run --duration 15m --vus 40 database-cache-performance-test.js

# Browser performance testing (requires Playwright)
k6 run --duration 10m --vus 15 browser-performance-test.js

# Memory leak detection (long-running)
k6 run --duration 30m --vus 20 memory-leak-detection-test.js
```

### Running Comprehensive Test Suite

```bash
# Quick test (5 minutes, light load)
node performance-test-orchestrator.js --level quick

# Standard test (15 minutes, medium load)
node performance-test-orchestrator.js --level standard

# Extended test (30 minutes, heavy load)
node performance-test-orchestrator.js --level extended

# Stress test (60 minutes, maximum load)
node performance-test-orchestrator.js --level stress

# Custom configuration
node performance-test-orchestrator.js --level standard --duration 20m --vus 75
```

## 📊 Performance Thresholds

### Response Time Thresholds
- **API Endpoints**: P95 < 3s, P99 < 8s
- **Authentication**: P95 < 2s, P99 < 5s
- **WebSocket Connection**: P95 < 2s, P99 < 5s
- **Database Queries**: P95 < 1.5s, P99 < 4s

### Core Web Vitals Thresholds
- **First Contentful Paint (FCP)**: P95 < 1.8s
- **Largest Contentful Paint (LCP)**: P95 < 2.5s
- **Cumulative Layout Shift (CLS)**: P95 < 0.1
- **Time to Interactive (TTI)**: P95 < 3s

### Reliability Thresholds
- **Error Rate**: < 5%
- **Availability**: > 99.9%
- **Cache Hit Rate**: > 80%
- **Memory Growth**: < 50MB over 30 minutes

### Scalability Thresholds
- **Concurrent Users**: Support 100+ simultaneous users
- **WebSocket Connections**: Handle 200+ concurrent connections
- **API Throughput**: Process 100+ requests/second
- **Database Connections**: Efficient connection pooling

## 🔧 Test Configuration

### Environment Variables

```bash
# Base application URL
BASE_URL=http://localhost:3000

# Test configuration
TEST_TYPE=mixed  # Options: mixed, auth_only, api_only, etc.
PERFORMANCE_TEST_MODE=true

# Database and cache settings
REDIS_URL=redis://localhost:6379
DATABASE_URL=your_database_connection_string

# External API settings (for testing)
META_API_TEST_TOKEN=your_test_token
META_API_TEST_ACCOUNT=your_test_account_id
```

### Custom Test Options

```javascript
// Example: Custom test configuration
const testOptions = {
  duration: '20m',
  vus: 50,
  testType: 'api_only',
  env: {
    CUSTOM_ENDPOINT: 'https://api.example.com',
    DEBUG_MODE: 'true'
  }
}
```

## 📈 Report Generation

### Automated Reports

The test orchestrator automatically generates:

1. **HTML Report**: Comprehensive visual report with charts and recommendations
2. **JSON Report**: Machine-readable results for integration
3. **Console Summary**: Quick overview of test results
4. **CI/CD Integration**: Automated pass/fail determination

### Report Contents

- **Executive Summary**: Overall performance assessment
- **Test Results**: Detailed metrics for each test suite
- **Performance Issues**: Identified bottlenecks and problems
- **Recommendations**: Specific actions to improve performance
- **Trend Analysis**: Performance changes over time
- **Threshold Compliance**: Pass/fail status for each metric

### Sample Report Structure

```
📊 PERFORMANCE TEST SUMMARY
==================================================
Total Tests: 6
✅ Passed: 4
⚠️  Warning: 1
❌ Failed: 1
🔍 Issues Found: 3
💡 Recommendations: 8
⏱️  Test Duration: 45m 32s
==================================================
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The included CI/CD workflow (`ci-cd-performance-integration.yml`) provides:

- **Automated Testing**: Triggered on pushes, PRs, and schedules
- **Multiple Test Levels**: Quick, standard, extended, and stress testing
- **Browser Compatibility**: Cross-browser testing with Playwright
- **Report Generation**: Automated report creation and artifact storage
- **Threshold Validation**: Automatic pass/fail determination
- **PR Comments**: Performance results posted to pull requests

### Integration Examples

```yaml
# Quick performance check on PR
- name: Quick Performance Test
  run: |
    node performance-test-orchestrator.js --level quick --duration 5m

# Nightly comprehensive testing
- name: Nightly Performance Test
  if: github.event_name == 'schedule'
  run: |
    node performance-test-orchestrator.js --level extended --duration 30m
```

## 🛠️ Troubleshooting

### Common Issues

1. **K6 Installation Problems**
```bash
# Verify K6 installation
k6 version

# Check if K6 is in PATH
which k6
```

2. **Application Not Responding**
```bash
# Check if application is running
curl http://localhost:3000/api/health

# Check application logs
npm run logs
```

3. **Memory Issues During Testing**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Monitor system resources
htop  # or top on macOS
```

4. **WebSocket Connection Failures**
```bash
# Check WebSocket endpoint
curl -H "Upgrade: websocket" http://localhost:3000/ws

# Verify firewall/proxy settings
```

### Performance Debugging

1. **Enable Debug Mode**
```bash
DEBUG=true k6 run test-script.js
```

2. **Increase Logging**
```bash
# Set log level
export LOG_LEVEL=debug
```

3. **Profile Application**
```bash
# Start with profiling
node --prof app.js

# Generate profile report
node --prof-process isolate-*.log > profile.txt
```

## 📚 Best Practices

### Test Design
- **Realistic Load Patterns**: Model actual user behavior
- **Gradual Ramp-up**: Avoid sudden load spikes unless testing for that
- **Meaningful Scenarios**: Test critical user journeys
- **Resource Cleanup**: Ensure proper test data cleanup

### Performance Optimization
- **Identify Bottlenecks**: Use profiling to find slow operations
- **Optimize Database Queries**: Add indexes, optimize query structure
- **Implement Caching**: Cache frequently accessed data
- **Monitor Resource Usage**: Track CPU, memory, and network usage

### Continuous Improvement
- **Regular Testing**: Run performance tests on every deployment
- **Trend Analysis**: Monitor performance changes over time
- **Threshold Updates**: Adjust performance thresholds based on requirements
- **Team Training**: Ensure team understands performance testing principles

## 🔗 Related Documentation

- [Authentication System Guide](../../AUTHENTICATION_SYSTEM.md)
- [API Documentation](../../API_DOCUMENTATION.md)
- [Deployment Guide](../../DEPLOYMENT_GUIDE.md)
- [Performance Optimization Guidelines](../../PERFORMANCE_OPTIMIZATION_GUIDELINES.md)
- [Monitoring Setup](../../MONITORING_SETUP.md)

## 🤝 Contributing

When adding new performance tests:

1. Follow the existing test structure and naming conventions
2. Include comprehensive metrics and thresholds
3. Add proper error handling and cleanup
4. Update this README with new test descriptions
5. Test your performance tests before submitting

### Test Development Guidelines

```javascript
// Example test structure
function testNewFeature() {
  group('New Feature Performance Test', () => {
    // Setup
    const startTime = Date.now()
    
    // Test execution
    const response = http.post(endpoint, payload)
    
    // Metrics collection
    const duration = Date.now() - startTime
    customMetric.add(duration)
    
    // Validation
    const success = check(response, {
      'response is successful': (r) => r.status === 200,
      'response time acceptable': () => duration < threshold,
    })
    
    // Cleanup
    // ... cleanup code
  })
}
```

## 📞 Support

For performance testing support:

1. **Issues**: Report bugs or request features via GitHub issues
2. **Performance Questions**: Contact the performance engineering team
3. **CI/CD Integration**: Reach out to the DevOps team
4. **Monitoring Setup**: Contact the monitoring and observability team

---

**Last Updated**: December 2024  
**Maintained By**: Performance Engineering Team  
**Version**: 1.0.0