#!/usr/bin/env node

/**
 * Comprehensive Test Runner Script
 * 
 * This script provides a unified interface for running all types of tests
 * in the Meta Ads Dashboard application.
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      e2e: null,
      performance: null,
      security: null,
      accessibility: null,
      visual: null,
      load: null,
      coverage: null
    }
    
    this.startTime = Date.now()
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = type === 'error' ? chalk.red('❌') : 
                   type === 'success' ? chalk.green('✅') : 
                   type === 'warning' ? chalk.yellow('⚠️') : 
                   chalk.blue('ℹ️')
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async runCommand(command, description, options = {}) {
    this.log(`Running: ${description}`)
    
    try {
      const result = execSync(command, {
        stdio: options.silent ? 'pipe' : 'inherit',
        encoding: 'utf8',
        timeout: options.timeout || 300000, // 5 minutes default
        ...options
      })
      
      this.log(`Completed: ${description}`, 'success')
      return { success: true, output: result }
    } catch (error) {
      this.log(`Failed: ${description} - ${error.message}`, 'error')
      return { success: false, error: error.message }
    }
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...')
    
    // Check if node_modules exists
    if (!fs.existsSync('./node_modules')) {
      this.log('Installing dependencies...', 'warning')
      await this.runCommand('npm install', 'Installing dependencies')
    }
    
    // Check if build exists
    if (!fs.existsSync('./.next')) {
      this.log('Building application...', 'warning')
      await this.runCommand('npm run build', 'Building application')
    }
    
    this.log('Prerequisites check completed', 'success')
  }

  async runUnitTests() {
    this.log('Starting unit tests...')
    const result = await this.runCommand(
      'npm run test:unit -- --coverage --watchAll=false',
      'Unit tests with coverage'
    )
    this.results.unit = result
    return result
  }

  async runIntegrationTests() {
    this.log('Starting integration tests...')
    const result = await this.runCommand(
      'npm run test:integration -- --watchAll=false',
      'Integration tests'
    )
    this.results.integration = result
    return result
  }

  async runPerformanceTests() {
    this.log('Starting performance tests...')
    const result = await this.runCommand(
      'npm run test:performance',
      'Performance tests'
    )
    this.results.performance = result
    return result
  }

  async runSecurityTests() {
    this.log('Starting security tests...')
    const result = await this.runCommand(
      'npm run test:security',
      'Security tests'
    )
    this.results.security = result
    return result
  }

  async runAccessibilityTests() {
    this.log('Starting accessibility tests...')
    const result = await this.runCommand(
      'npm run test:accessibility',
      'Accessibility tests'
    )
    this.results.accessibility = result
    return result
  }

  async runE2ETests() {
    this.log('Starting E2E tests...')
    
    // Start the application
    this.log('Starting application server...')
    const serverProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      detached: true
    })
    
    // Wait for server to be ready
    await new Promise((resolve) => {
      setTimeout(resolve, 30000) // Wait 30 seconds for server startup
    })
    
    try {
      const result = await this.runCommand(
        'npx cypress run --headless',
        'E2E tests with Cypress',
        { timeout: 600000 } // 10 minutes for E2E tests
      )
      this.results.e2e = result
      return result
    } finally {
      // Kill the server process
      process.kill(-serverProcess.pid)
    }
  }

  async runVisualTests() {
    this.log('Starting visual regression tests...')
    
    // Start the application
    this.log('Starting application server for visual tests...')
    const serverProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      detached: true
    })
    
    // Wait for server to be ready
    await new Promise((resolve) => {
      setTimeout(resolve, 30000)
    })
    
    try {
      const result = await this.runCommand(
        'npx playwright test',
        'Visual regression tests with Playwright',
        { timeout: 600000 }
      )
      this.results.visual = result
      return result
    } finally {
      // Kill the server process
      process.kill(-serverProcess.pid)
    }
  }

  async runLoadTests() {
    this.log('Starting load tests...')
    
    // Start the application
    this.log('Starting application server for load tests...')
    const serverProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      detached: true
    })
    
    // Wait for server to be ready
    await new Promise((resolve) => {
      setTimeout(resolve, 30000)
    })
    
    try {
      // Run Artillery load tests
      const artilleryResult = await this.runCommand(
        'artillery run __tests__/load-testing/artillery-config.yml',
        'Artillery load tests',
        { timeout: 300000 }
      )
      
      // Run K6 load tests if k6 is available
      try {
        const k6Result = await this.runCommand(
          'k6 run __tests__/load-testing/k6-load-test.js',
          'K6 load tests',
          { timeout: 300000 }
        )
        
        this.results.load = {
          success: artilleryResult.success && k6Result.success,
          artillery: artilleryResult,
          k6: k6Result
        }
      } catch (error) {
        this.log('K6 not available, skipping K6 tests', 'warning')
        this.results.load = artilleryResult
      }
      
      return this.results.load
    } finally {
      // Kill the server process
      process.kill(-serverProcess.pid)
    }
  }

  async runCoverageAnalysis() {
    this.log('Starting coverage analysis...')
    const result = await this.runCommand(
      'npm run test -- __tests__/coverage/coverage-analysis.test.ts',
      'Coverage analysis'
    )
    this.results.coverage = result
    return result
  }

  async runLighthouseAudit() {
    this.log('Starting Lighthouse performance audit...')
    
    // Start the application
    const serverProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      detached: true
    })
    
    // Wait for server to be ready
    await new Promise((resolve) => {
      setTimeout(resolve, 30000)
    })
    
    try {
      const result = await this.runCommand(
        'lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html --chrome-flags="--headless"',
        'Lighthouse audit',
        { timeout: 180000 }
      )
      return result
    } finally {
      // Kill the server process
      process.kill(-serverProcess.pid)
    }
  }

  generateReport() {
    const endTime = Date.now()
    const duration = Math.round((endTime - this.startTime) / 1000)
    
    console.log('\n' + '='.repeat(60))
    console.log(chalk.bold.blue('🧪 TEST EXECUTION SUMMARY'))
    console.log('='.repeat(60))
    
    const testTypes = Object.keys(this.results)
    let passed = 0
    let failed = 0
    let skipped = 0
    
    testTypes.forEach(type => {
      const result = this.results[type]
      if (result === null) {
        console.log(`${chalk.gray('⏭️  ' + type.padEnd(15))} SKIPPED`)
        skipped++
      } else if (result.success) {
        console.log(`${chalk.green('✅ ' + type.padEnd(15))} PASSED`)
        passed++
      } else {
        console.log(`${chalk.red('❌ ' + type.padEnd(15))} FAILED`)
        failed++
      }
    })
    
    console.log('\n' + '-'.repeat(60))
    console.log(`${chalk.green('Passed:')} ${passed}`)
    console.log(`${chalk.red('Failed:')} ${failed}`)
    console.log(`${chalk.gray('Skipped:')} ${skipped}`)
    console.log(`${chalk.blue('Duration:')} ${duration}s`)
    
    // Generate detailed report file
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: duration,
      summary: { passed, failed, skipped },
      results: this.results
    }
    
    fs.writeFileSync('./test-report.json', JSON.stringify(reportData, null, 2))
    this.log('Detailed report saved to test-report.json')
    
    return failed === 0
  }

  async runAll() {
    this.log('Starting comprehensive test suite...')
    
    await this.checkPrerequisites()
    
    // Run tests in optimal order
    await this.runUnitTests()
    await this.runIntegrationTests()
    await this.runPerformanceTests()
    await this.runSecurityTests()
    await this.runAccessibilityTests()
    
    // Long-running tests
    if (process.env.INCLUDE_E2E !== 'false') {
      await this.runE2ETests()
    }
    
    if (process.env.INCLUDE_VISUAL !== 'false') {
      await this.runVisualTests()
    }
    
    // Resource-intensive tests (optional)
    if (process.env.INCLUDE_LOAD === 'true') {
      await this.runLoadTests()
    }
    
    await this.runCoverageAnalysis()
    
    const allTestsPassed = this.generateReport()
    
    if (allTestsPassed) {
      this.log('🎉 All tests passed successfully!', 'success')
      process.exit(0)
    } else {
      this.log('💥 Some tests failed. Check the report for details.', 'error')
      process.exit(1)
    }
  }

  async runQuick() {
    this.log('Starting quick test suite...')
    
    await this.checkPrerequisites()
    await this.runUnitTests()
    await this.runIntegrationTests()
    await this.runSecurityTests()
    
    const quickTestsPassed = this.generateReport()
    
    if (quickTestsPassed) {
      this.log('🚀 Quick tests passed!', 'success')
      process.exit(0)
    } else {
      this.log('⚠️  Some quick tests failed.', 'error')
      process.exit(1)
    }
  }
}

// CLI interface
const runner = new TestRunner()
const command = process.argv[2] || 'help'

switch (command) {
  case 'all':
    runner.runAll()
    break
  case 'quick':
    runner.runQuick()
    break
  case 'unit':
    runner.checkPrerequisites().then(() => runner.runUnitTests()).then(() => runner.generateReport())
    break
  case 'integration':
    runner.checkPrerequisites().then(() => runner.runIntegrationTests()).then(() => runner.generateReport())
    break
  case 'e2e':
    runner.checkPrerequisites().then(() => runner.runE2ETests()).then(() => runner.generateReport())
    break
  case 'performance':
    runner.checkPrerequisites().then(() => runner.runPerformanceTests()).then(() => runner.generateReport())
    break
  case 'security':
    runner.checkPrerequisites().then(() => runner.runSecurityTests()).then(() => runner.generateReport())
    break
  case 'accessibility':
    runner.checkPrerequisites().then(() => runner.runAccessibilityTests()).then(() => runner.generateReport())
    break
  case 'visual':
    runner.checkPrerequisites().then(() => runner.runVisualTests()).then(() => runner.generateReport())
    break
  case 'load':
    runner.checkPrerequisites().then(() => runner.runLoadTests()).then(() => runner.generateReport())
    break
  case 'lighthouse':
    runner.checkPrerequisites().then(() => runner.runLighthouseAudit()).then(() => runner.generateReport())
    break
  case 'coverage':
    runner.checkPrerequisites().then(() => runner.runCoverageAnalysis()).then(() => runner.generateReport())
    break
  default:
    console.log(`
${chalk.bold.blue('Meta Ads Dashboard Test Runner')}

Usage: node test-scripts.js <command>

Commands:
  ${chalk.green('all')}           Run the complete test suite
  ${chalk.green('quick')}         Run quick tests (unit, integration, security)
  ${chalk.green('unit')}          Run unit tests only
  ${chalk.green('integration')}  Run integration tests only
  ${chalk.green('e2e')}           Run end-to-end tests only
  ${chalk.green('performance')}  Run performance tests only
  ${chalk.green('security')}     Run security tests only
  ${chalk.green('accessibility')} Run accessibility tests only
  ${chalk.green('visual')}       Run visual regression tests only
  ${chalk.green('load')}          Run load tests only
  ${chalk.green('lighthouse')}   Run Lighthouse audit only
  ${chalk.green('coverage')}     Run coverage analysis only

Environment Variables:
  INCLUDE_E2E=false     Skip E2E tests in 'all' command
  INCLUDE_VISUAL=false  Skip visual tests in 'all' command
  INCLUDE_LOAD=true     Include load tests in 'all' command

Examples:
  node test-scripts.js all
  INCLUDE_LOAD=true node test-scripts.js all
  node test-scripts.js quick
`)
}