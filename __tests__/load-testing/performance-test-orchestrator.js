// Performance Testing Orchestrator for Meta Ads Dashboard
// Coordinates all performance tests and generates comprehensive reports

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  duration: {
    quick: '5m',
    standard: '15m',
    extended: '30m',
    stress: '60m',
  },
  concurrency: {
    light: 10,
    medium: 25,
    heavy: 50,
    stress: 100,
  },
  reportDir: path.join(__dirname, '../reports'),
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
}

// Test suite definitions
const TEST_SUITES = {
  auth: {
    name: 'Authentication Load Testing',
    script: 'auth-load-test.js',
    description: 'Tests authentication system under load',
    scenarios: ['normal_auth_load', 'auth_spike_test', 'session_stress_test', 'rate_limit_test'],
    priority: 'high',
  },
  api: {
    name: 'API Comprehensive Load Testing',
    script: 'api-comprehensive-load-test.js',
    description: 'Tests all API endpoints under various load conditions',
    scenarios: ['baseline_api_test', 'meta_api_load', 'mixed_api_simulation'],
    priority: 'high',
  },
  websocket: {
    name: 'WebSocket Performance Testing',
    script: 'websocket-load-test.js',
    description: 'Tests real-time WebSocket connections at scale',
    scenarios: ['baseline_ws_test', 'connection_scaling', 'high_frequency_messages'],
    priority: 'high',
  },
  database: {
    name: 'Database and Cache Performance Testing',
    script: 'database-cache-performance-test.js',
    description: 'Tests data storage, retrieval, and caching under load',
    scenarios: ['cache_baseline_test', 'data_retrieval_stress', 'concurrent_operations'],
    priority: 'high',
  },
  browser: {
    name: 'Browser Performance Testing',
    script: 'browser-performance-test.js',
    description: 'Tests front-end performance and user experience',
    scenarios: ['baseline_browser_test', 'multi_browser_test', 'mobile_performance_test'],
    priority: 'medium',
  },
  memory: {
    name: 'Memory Leak Detection Testing',
    script: 'memory-leak-detection-test.js',
    description: 'Tests memory usage and leak detection',
    scenarios: ['sustained_memory_monitoring', 'memory_stress_test', 'long_running_session'],
    priority: 'medium',
  },
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  response_time_p95: 3000,     // 95th percentile < 3s
  response_time_p99: 8000,     // 99th percentile < 8s
  error_rate: 0.05,            // < 5% error rate
  throughput_min: 100,         // > 100 requests/second
  availability: 0.999,         // > 99.9% availability
  memory_growth_max: 50,       // < 50MB memory growth
  cache_hit_rate_min: 0.80,    // > 80% cache hit rate
}

class PerformanceTestOrchestrator {
  constructor() {
    this.results = new Map()
    this.reportData = {
      startTime: new Date().toISOString(),
      endTime: null,
      summary: {},
      testResults: [],
      recommendations: [],
      issues: [],
    }
    this.ensureReportDirectory()
  }

  ensureReportDirectory() {
    if (!existsSync(TEST_CONFIG.reportDir)) {
      mkdirSync(TEST_CONFIG.reportDir, { recursive: true })
    }
  }

  async runTestSuite(suiteName, options = {}) {
    const suite = TEST_SUITES[suiteName]
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found`)
    }

    console.log(`\n🚀 Running ${suite.name}...`)
    console.log(`Description: ${suite.description}`)
    console.log(`Priority: ${suite.priority}`)

    const testOptions = {
      duration: options.duration || TEST_CONFIG.duration.standard,
      vus: options.vus || TEST_CONFIG.concurrency.medium,
      ...options,
    }

    try {
      const result = await this.executeK6Test(suite.script, testOptions)
      this.results.set(suiteName, result)
      this.analyzeTestResult(suiteName, result)
      
      console.log(`✅ ${suite.name} completed`)
      return result
    } catch (error) {
      console.error(`❌ ${suite.name} failed:`, error.message)
      this.results.set(suiteName, { error: error.message })
      throw error
    }
  }

  async executeK6Test(scriptPath, options = {}) {
    const scriptFullPath = path.join(__dirname, scriptPath)
    const outputFile = path.join(TEST_CONFIG.reportDir, `${path.basename(scriptPath, '.js')}-${TEST_CONFIG.timestamp}.json`)

    // Build k6 command
    const k6Command = [
      'k6 run',
      `--out json=${outputFile}`,
      `--duration ${options.duration}`,
      `--vus ${options.vus}`,
      options.testType ? `-e TEST_TYPE=${options.testType}` : '',
      options.env ? Object.entries(options.env).map(([k, v]) => `-e ${k}=${v}`).join(' ') : '',
      scriptFullPath,
    ].filter(Boolean).join(' ')

    console.log(`Executing: ${k6Command}`)

    try {
      const output = execSync(k6Command, { 
        encoding: 'utf8',
        timeout: (parseInt(options.duration) || 15) * 60 * 1000 + 60000, // Add 1 minute buffer
      })

      // Parse results
      const result = this.parseK6Output(outputFile, output)
      return result
    } catch (error) {
      console.error('K6 execution error:', error.message)
      throw error
    }
  }

  parseK6Output(outputFile, consoleOutput) {
    let metrics = {}
    let summary = {}

    // Parse JSON output if available
    if (existsSync(outputFile)) {
      try {
        const jsonData = readFileSync(outputFile, 'utf8')
        const lines = jsonData.trim().split('\n')
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.type === 'Point') {
              const metricName = data.metric
              if (!metrics[metricName]) {
                metrics[metricName] = []
              }
              metrics[metricName].push(data.data)
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      } catch (error) {
        console.warn('Failed to parse JSON output:', error.message)
      }
    }

    // Parse console output for summary
    const summaryMatch = consoleOutput.match(/^\s*✓.*$/gm)
    if (summaryMatch) {
      summary.checks = summaryMatch.map(line => line.trim())
    }

    // Extract performance metrics from console output
    const metricsMatch = consoleOutput.match(/^\s*\w+.*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./gm)
    if (metricsMatch) {
      summary.performance = metricsMatch.map(line => line.trim())
    }

    return {
      metrics,
      summary,
      consoleOutput,
      timestamp: new Date().toISOString(),
    }
  }

  analyzeTestResult(suiteName, result) {
    const analysis = {
      suiteName,
      timestamp: result.timestamp,
      status: 'unknown',
      performance: {},
      issues: [],
      recommendations: [],
    }

    try {
      // Analyze metrics
      if (result.metrics) {
        analysis.performance = this.calculatePerformanceMetrics(result.metrics)
        analysis.status = this.determineTestStatus(analysis.performance)
        analysis.issues = this.identifyPerformanceIssues(analysis.performance)
        analysis.recommendations = this.generateRecommendations(suiteName, analysis.performance, analysis.issues)
      }

      // Add to report data
      this.reportData.testResults.push(analysis)
      this.reportData.issues.push(...analysis.issues)
      this.reportData.recommendations.push(...analysis.recommendations)

    } catch (error) {
      console.error('Analysis error:', error.message)
      analysis.status = 'error'
      analysis.error = error.message
    }

    return analysis
  }

  calculatePerformanceMetrics(metrics) {
    const calculated = {}

    // Response time metrics
    if (metrics.http_req_duration) {
      const durations = metrics.http_req_duration.map(d => d.value)
      calculated.response_time = {
        avg: this.average(durations),
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99),
        max: Math.max(...durations),
        min: Math.min(...durations),
      }
    }

    // Error rate
    if (metrics.http_req_failed) {
      const failures = metrics.http_req_failed.reduce((sum, d) => sum + d.value, 0)
      const total = metrics.http_req_failed.length
      calculated.error_rate = total > 0 ? failures / total : 0
    }

    // Throughput
    if (metrics.http_reqs) {
      const requests = metrics.http_reqs.length
      const timespan = this.getTestDuration(metrics.http_reqs)
      calculated.throughput = timespan > 0 ? requests / (timespan / 1000) : 0
    }

    // Memory metrics
    if (metrics.heap_usage_mb) {
      const memoryUsage = metrics.heap_usage_mb.map(d => d.value)
      calculated.memory = {
        avg: this.average(memoryUsage),
        max: Math.max(...memoryUsage),
        growth: Math.max(...memoryUsage) - Math.min(...memoryUsage),
      }
    }

    // Cache metrics
    if (metrics.cache_hit_rate) {
      const hitRates = metrics.cache_hit_rate.map(d => d.value)
      calculated.cache_hit_rate = this.average(hitRates)
    }

    // WebSocket metrics
    if (metrics.ws_connection_time) {
      const connectionTimes = metrics.ws_connection_time.map(d => d.value)
      calculated.websocket = {
        connection_time_avg: this.average(connectionTimes),
        connection_time_p95: this.percentile(connectionTimes, 95),
      }
    }

    return calculated
  }

  determineTestStatus(performance) {
    let status = 'pass'
    
    // Check response time thresholds
    if (performance.response_time) {
      if (performance.response_time.p95 > PERFORMANCE_THRESHOLDS.response_time_p95) {
        status = 'warning'
      }
      if (performance.response_time.p99 > PERFORMANCE_THRESHOLDS.response_time_p99) {
        status = 'fail'
      }
    }

    // Check error rate
    if (performance.error_rate > PERFORMANCE_THRESHOLDS.error_rate) {
      status = 'fail'
    }

    // Check memory growth
    if (performance.memory && performance.memory.growth > PERFORMANCE_THRESHOLDS.memory_growth_max) {
      status = 'warning'
    }

    return status
  }

  identifyPerformanceIssues(performance) {
    const issues = []

    if (performance.response_time) {
      if (performance.response_time.p95 > PERFORMANCE_THRESHOLDS.response_time_p95) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          description: `High response time: P95 is ${performance.response_time.p95}ms (threshold: ${PERFORMANCE_THRESHOLDS.response_time_p95}ms)`,
        })
      }
      if (performance.response_time.p99 > PERFORMANCE_THRESHOLDS.response_time_p99) {
        issues.push({
          type: 'performance',
          severity: 'high',
          description: `Very high response time: P99 is ${performance.response_time.p99}ms (threshold: ${PERFORMANCE_THRESHOLDS.response_time_p99}ms)`,
        })
      }
    }

    if (performance.error_rate > PERFORMANCE_THRESHOLDS.error_rate) {
      issues.push({
        type: 'reliability',
        severity: 'high',
        description: `High error rate: ${(performance.error_rate * 100).toFixed(2)}% (threshold: ${PERFORMANCE_THRESHOLDS.error_rate * 100}%)`,
      })
    }

    if (performance.throughput && performance.throughput < PERFORMANCE_THRESHOLDS.throughput_min) {
      issues.push({
        type: 'capacity',
        severity: 'medium',
        description: `Low throughput: ${performance.throughput.toFixed(2)} req/s (threshold: ${PERFORMANCE_THRESHOLDS.throughput_min} req/s)`,
      })
    }

    if (performance.memory && performance.memory.growth > PERFORMANCE_THRESHOLDS.memory_growth_max) {
      issues.push({
        type: 'memory',
        severity: 'medium',
        description: `High memory growth: ${performance.memory.growth.toFixed(2)}MB (threshold: ${PERFORMANCE_THRESHOLDS.memory_growth_max}MB)`,
      })
    }

    if (performance.cache_hit_rate && performance.cache_hit_rate < PERFORMANCE_THRESHOLDS.cache_hit_rate_min) {
      issues.push({
        type: 'caching',
        severity: 'low',
        description: `Low cache hit rate: ${(performance.cache_hit_rate * 100).toFixed(2)}% (threshold: ${PERFORMANCE_THRESHOLDS.cache_hit_rate_min * 100}%)`,
      })
    }

    return issues
  }

  generateRecommendations(suiteName, performance, issues) {
    const recommendations = []

    // Response time recommendations
    if (issues.some(i => i.type === 'performance')) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        description: 'Optimize slow API endpoints and database queries',
        actions: [
          'Add database indexes for frequently queried fields',
          'Implement response caching for static data',
          'Consider API response pagination for large datasets',
          'Profile and optimize slow application code paths',
        ],
      })
    }

    // Error rate recommendations
    if (issues.some(i => i.type === 'reliability')) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        description: 'Improve error handling and system reliability',
        actions: [
          'Implement circuit breakers for external API calls',
          'Add retry logic with exponential backoff',
          'Improve input validation and error responses',
          'Set up better monitoring and alerting',
        ],
      })
    }

    // Memory recommendations
    if (issues.some(i => i.type === 'memory')) {
      recommendations.push({
        category: 'memory',
        priority: 'medium',
        description: 'Address memory usage and potential leaks',
        actions: [
          'Implement proper cleanup of event listeners',
          'Review cache eviction policies',
          'Optimize data structures and object lifecycle',
          'Add memory monitoring and alerts',
        ],
      })
    }

    // Caching recommendations
    if (issues.some(i => i.type === 'caching')) {
      recommendations.push({
        category: 'caching',
        priority: 'low',
        description: 'Improve caching strategy and hit rates',
        actions: [
          'Review cache TTL settings',
          'Implement cache warming strategies',
          'Add cache metrics and monitoring',
          'Consider implementing cache invalidation patterns',
        ],
      })
    }

    // Suite-specific recommendations
    switch (suiteName) {
      case 'websocket':
        if (performance.websocket && performance.websocket.connection_time_avg > 2000) {
          recommendations.push({
            category: 'websocket',
            priority: 'medium',
            description: 'Optimize WebSocket connection performance',
            actions: [
              'Implement connection pooling',
              'Add WebSocket compression',
              'Optimize heartbeat intervals',
              'Consider horizontal scaling',
            ],
          })
        }
        break

      case 'browser':
        recommendations.push({
          category: 'frontend',
          priority: 'medium',
          description: 'Optimize frontend performance',
          actions: [
            'Implement code splitting and lazy loading',
            'Optimize image compression and delivery',
            'Minimize JavaScript bundle sizes',
            'Add service worker for caching',
          ],
        })
        break
    }

    return recommendations
  }

  async runComprehensiveTest(options = {}) {
    console.log('🎯 Starting Comprehensive Performance Test Suite')
    console.log(`Base URL: ${TEST_CONFIG.baseUrl}`)
    console.log(`Report Directory: ${TEST_CONFIG.reportDir}`)

    const testLevel = options.level || 'standard' // quick, standard, extended, stress
    const testDuration = TEST_CONFIG.duration[testLevel]
    const testConcurrency = TEST_CONFIG.concurrency[testLevel]

    console.log(`Test Level: ${testLevel}`)
    console.log(`Duration: ${testDuration}`)
    console.log(`Concurrency: ${testConcurrency}`)

    // Determine which tests to run based on level
    let suitesToRun = []
    
    switch (testLevel) {
      case 'quick':
        suitesToRun = ['auth', 'api']
        break
      case 'standard':
        suitesToRun = ['auth', 'api', 'websocket', 'database']
        break
      case 'extended':
        suitesToRun = ['auth', 'api', 'websocket', 'database', 'browser']
        break
      case 'stress':
        suitesToRun = Object.keys(TEST_SUITES)
        break
      default:
        suitesToRun = ['auth', 'api', 'websocket', 'database']
    }

    // Run tests sequentially to avoid resource conflicts
    for (const suiteName of suitesToRun) {
      try {
        await this.runTestSuite(suiteName, {
          duration: testDuration,
          vus: testConcurrency,
          ...options,
        })
        
        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (error) {
        console.error(`Failed to run ${suiteName}:`, error.message)
        // Continue with other tests
      }
    }

    // Generate final report
    this.reportData.endTime = new Date().toISOString()
    this.generateFinalReport()

    console.log('\n🏁 Comprehensive Performance Test Suite Completed')
    console.log(`Report generated: ${this.getReportPath()}`)
  }

  generateFinalReport() {
    // Calculate summary statistics
    this.reportData.summary = {
      totalTests: this.reportData.testResults.length,
      passedTests: this.reportData.testResults.filter(r => r.status === 'pass').length,
      warningTests: this.reportData.testResults.filter(r => r.status === 'warning').length,
      failedTests: this.reportData.testResults.filter(r => r.status === 'fail').length,
      totalIssues: this.reportData.issues.length,
      highSeverityIssues: this.reportData.issues.filter(i => i.severity === 'high').length,
      totalRecommendations: this.reportData.recommendations.length,
      testDuration: this.calculateTestDuration(),
    }

    // Generate HTML report
    this.generateHTMLReport()
    
    // Generate JSON report
    this.generateJSONReport()

    // Generate summary to console
    this.printSummary()
  }

  generateHTMLReport() {
    const reportPath = this.getReportPath('html')
    const html = this.buildHTMLReport()
    writeFileSync(reportPath, html)
  }

  generateJSONReport() {
    const reportPath = this.getReportPath('json')
    writeFileSync(reportPath, JSON.stringify(this.reportData, null, 2))
  }

  buildHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meta Ads Dashboard - Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .summary-card.pass { border-left: 4px solid #28a745; }
        .summary-card.warning { border-left: 4px solid #ffc107; }
        .summary-card.fail { border-left: 4px solid #dc3545; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .test-result { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 6px; }
        .test-result.pass { border-left: 4px solid #28a745; }
        .test-result.warning { border-left: 4px solid #ffc107; }
        .test-result.fail { border-left: 4px solid #dc3545; }
        .issue { background: #fff; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; }
        .issue.medium { border-left-color: #ffc107; }
        .issue.low { border-left-color: #17a2b8; }
        .recommendation { background: #e7f3ff; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }
        .metric { display: inline-block; margin: 5px 10px 5px 0; padding: 5px 10px; background: #e9ecef; border-radius: 4px; }
        .timestamp { color: #666; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .actions { list-style-type: none; padding-left: 0; }
        .actions li { margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Meta Ads Dashboard Performance Test Report</h1>
            <p class="timestamp">Generated: ${this.reportData.endTime}</p>
            <p>Test Duration: ${this.reportData.summary.testDuration}</p>
        </div>

        <div class="summary">
            <div class="summary-card pass">
                <h3>${this.reportData.summary.passedTests}</h3>
                <p>Passed Tests</p>
            </div>
            <div class="summary-card warning">
                <h3>${this.reportData.summary.warningTests}</h3>
                <p>Warning Tests</p>
            </div>
            <div class="summary-card fail">
                <h3>${this.reportData.summary.failedTests}</h3>
                <p>Failed Tests</p>
            </div>
            <div class="summary-card">
                <h3>${this.reportData.summary.totalIssues}</h3>
                <p>Total Issues</p>
            </div>
        </div>

        <div class="section">
            <h2>Test Results</h2>
            ${this.reportData.testResults.map(result => `
                <div class="test-result ${result.status}">
                    <h3>${TEST_SUITES[result.suiteName]?.name || result.suiteName}</h3>
                    <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
                    <p><strong>Timestamp:</strong> ${result.timestamp}</p>
                    ${result.performance ? this.formatPerformanceMetrics(result.performance) : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>Performance Issues</h2>
            ${this.reportData.issues.map(issue => `
                <div class="issue ${issue.severity}">
                    <h4>${issue.type.toUpperCase()} - ${issue.severity.toUpperCase()}</h4>
                    <p>${issue.description}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>Recommendations</h2>
            ${this.reportData.recommendations.map(rec => `
                <div class="recommendation">
                    <h4>${rec.category.toUpperCase()} - ${rec.priority.toUpperCase()} Priority</h4>
                    <p>${rec.description}</p>
                    <ul class="actions">
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `
  }

  formatPerformanceMetrics(performance) {
    let html = '<div class="metrics">'
    
    if (performance.response_time) {
      html += `<span class="metric">Avg Response: ${performance.response_time.avg.toFixed(0)}ms</span>`
      html += `<span class="metric">P95: ${performance.response_time.p95.toFixed(0)}ms</span>`
      html += `<span class="metric">P99: ${performance.response_time.p99.toFixed(0)}ms</span>`
    }
    
    if (performance.error_rate !== undefined) {
      html += `<span class="metric">Error Rate: ${(performance.error_rate * 100).toFixed(2)}%</span>`
    }
    
    if (performance.throughput) {
      html += `<span class="metric">Throughput: ${performance.throughput.toFixed(1)} req/s</span>`
    }
    
    if (performance.memory) {
      html += `<span class="metric">Memory Growth: ${performance.memory.growth.toFixed(1)}MB</span>`
    }
    
    if (performance.cache_hit_rate) {
      html += `<span class="metric">Cache Hit Rate: ${(performance.cache_hit_rate * 100).toFixed(1)}%</span>`
    }
    
    html += '</div>'
    return html
  }

  printSummary() {
    console.log('\n📊 PERFORMANCE TEST SUMMARY')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${this.reportData.summary.totalTests}`)
    console.log(`✅ Passed: ${this.reportData.summary.passedTests}`)
    console.log(`⚠️  Warning: ${this.reportData.summary.warningTests}`)
    console.log(`❌ Failed: ${this.reportData.summary.failedTests}`)
    console.log(`🔍 Issues Found: ${this.reportData.summary.totalIssues}`)
    console.log(`💡 Recommendations: ${this.reportData.summary.totalRecommendations}`)
    console.log(`⏱️  Test Duration: ${this.reportData.summary.testDuration}`)
    console.log('=' .repeat(50))

    if (this.reportData.summary.highSeverityIssues > 0) {
      console.log(`\n⚠️  ${this.reportData.summary.highSeverityIssues} HIGH SEVERITY ISSUES FOUND!`)
      console.log('Please review the detailed report for recommendations.')
    }

    console.log(`\n📋 Detailed reports:`)
    console.log(`HTML: ${this.getReportPath('html')}`)
    console.log(`JSON: ${this.getReportPath('json')}`)
  }

  getReportPath(format = 'html') {
    const extension = format === 'html' ? 'html' : 'json'
    return path.join(TEST_CONFIG.reportDir, `performance-test-report-${TEST_CONFIG.timestamp}.${extension}`)
  }

  calculateTestDuration() {
    if (!this.reportData.startTime || !this.reportData.endTime) return 'Unknown'
    
    const start = new Date(this.reportData.startTime)
    const end = new Date(this.reportData.endTime)
    const durationMs = end - start
    
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  // Utility functions
  average(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const index = (p / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1
    
    if (lower === upper) return sorted[lower]
    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  getTestDuration(dataPoints) {
    if (dataPoints.length < 2) return 0
    const start = Math.min(...dataPoints.map(d => new Date(d.time).getTime()))
    const end = Math.max(...dataPoints.map(d => new Date(d.time).getTime()))
    return end - start
  }
}

// CLI interface
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const orchestrator = new PerformanceTestOrchestrator()
  
  const args = process.argv.slice(2)
  const options = {}
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--level':
        options.level = args[++i]
        break
      case '--duration':
        options.duration = args[++i]
        break
      case '--vus':
        options.vus = parseInt(args[++i])
        break
      case '--suite':
        options.suite = args[++i]
        break
      case '--help':
        console.log(`
Usage: node performance-test-orchestrator.js [options]

Options:
  --level <quick|standard|extended|stress>  Test level (default: standard)
  --duration <duration>                     Test duration (e.g., 5m, 15m, 30m)
  --vus <number>                           Virtual users (default: 25)
  --suite <suite-name>                     Run specific test suite only
  --help                                   Show this help message

Examples:
  node performance-test-orchestrator.js --level quick
  node performance-test-orchestrator.js --level stress --duration 60m --vus 100
  node performance-test-orchestrator.js --suite auth --duration 10m
        `)
        process.exit(0)
    }
  }

  // Run tests
  if (options.suite) {
    orchestrator.runTestSuite(options.suite, options)
      .catch(error => {
        console.error('Test execution failed:', error.message)
        process.exit(1)
      })
  } else {
    orchestrator.runComprehensiveTest(options)
      .catch(error => {
        console.error('Test execution failed:', error.message)
        process.exit(1)
      })
  }
}

export default PerformanceTestOrchestrator