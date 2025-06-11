#!/usr/bin/env node
// Performance testing script for Meta Ads Dashboard
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')
const path = require('path')

console.log('🚀 Running performance tests...\n')

async function runPerformanceTests() {
  let chrome
  
  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    })
    
    const options = {
      logLevel: 'info',
      output: 'html',
      onlyCategories: ['performance'],
      port: chrome.port,
    }
    
    // Test URLs
    const testUrls = [
      'http://localhost:3000',
      'http://localhost:3000/dashboard',
      'http://localhost:3000/pattern-analysis'
    ]
    
    const results = []
    
    for (const url of testUrls) {
      console.log(`📊 Testing ${url}...`)
      
      try {
        const runnerResult = await lighthouse(url, options)
        
        if (runnerResult && runnerResult.lhr) {
          const { lhr } = runnerResult
          const performance = lhr.categories.performance
          
          const metrics = {
            url,
            performanceScore: Math.round(performance.score * 100),
            firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
            largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
            firstInputDelay: lhr.audits['max-potential-fid']?.numericValue || 0,
            cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
            speedIndex: lhr.audits['speed-index'].numericValue,
            timeToInteractive: lhr.audits['interactive'].numericValue,
            totalBlockingTime: lhr.audits['total-blocking-time'].numericValue
          }
          
          results.push(metrics)
          
          console.log(`  ✅ Performance Score: ${metrics.performanceScore}/100`)
          console.log(`  🎯 FCP: ${Math.round(metrics.firstContentfulPaint)}ms`)
          console.log(`  🎯 LCP: ${Math.round(metrics.largestContentfulPaint)}ms`)
          console.log(`  🎯 CLS: ${metrics.cumulativeLayoutShift.toFixed(3)}`)
          console.log(`  🎯 TTI: ${Math.round(metrics.timeToInteractive)}ms`)
          console.log('')
          
          // Save detailed report
          const reportPath = path.join(process.cwd(), 'performance-reports', `${url.replace(/[^\w]/g, '_')}_report.html`)
          fs.mkdirSync(path.dirname(reportPath), { recursive: true })
          fs.writeFileSync(reportPath, runnerResult.report)
          console.log(`  📄 Detailed report saved: ${reportPath}`)
        }
      } catch (error) {
        console.log(`  ❌ Failed to test ${url}: ${error.message}`)
      }
    }
    
    // Generate summary report
    if (results.length > 0) {
      generateSummaryReport(results)
      checkPerformanceTargets(results)
    }
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error)
  } finally {
    if (chrome) {
      await chrome.kill()
    }
  }
}

function generateSummaryReport(results) {
  console.log('\n📈 Performance Summary:')
  console.log('=' .repeat(60))
  
  const avg = results.reduce((acc, result) => {
    Object.keys(result).forEach(key => {
      if (typeof result[key] === 'number') {
        acc[key] = (acc[key] || 0) + result[key]
      }
    })
    return acc
  }, {})
  
  Object.keys(avg).forEach(key => {
    if (typeof avg[key] === 'number') {
      avg[key] = avg[key] / results.length
    }
  })
  
  console.log(`Average Performance Score: ${Math.round(avg.performanceScore)}/100`)
  console.log(`Average FCP: ${Math.round(avg.firstContentfulPaint)}ms`)
  console.log(`Average LCP: ${Math.round(avg.largestContentfulPaint)}ms`)
  console.log(`Average CLS: ${avg.cumulativeLayoutShift.toFixed(3)}`)
  console.log(`Average TTI: ${Math.round(avg.timeToInteractive)}ms`)
  console.log(`Average Speed Index: ${Math.round(avg.speedIndex)}ms`)
  
  // Save summary to file
  const summaryPath = path.join(process.cwd(), 'performance-reports', 'summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify({ results, averages: avg }, null, 2))
  console.log(`\n📊 Summary saved: ${summaryPath}`)
}

function checkPerformanceTargets(results) {
  console.log('\n🎯 Performance Target Check:')
  console.log('=' .repeat(60))
  
  const targets = {
    performanceScore: { min: 90, label: 'Performance Score' },
    firstContentfulPaint: { max: 1800, label: 'First Contentful Paint' },
    largestContentfulPaint: { max: 2500, label: 'Largest Contentful Paint' },
    cumulativeLayoutShift: { max: 0.1, label: 'Cumulative Layout Shift' },
    timeToInteractive: { max: 3000, label: 'Time to Interactive' },
    totalBlockingTime: { max: 200, label: 'Total Blocking Time' }
  }
  
  results.forEach((result, index) => {
    console.log(`\n📄 ${result.url}:`)
    
    Object.entries(targets).forEach(([metric, target]) => {
      const value = result[metric]
      let status = '✅ PASS'
      
      if (target.min && value < target.min) {
        status = '❌ FAIL'
      } else if (target.max && value > target.max) {
        status = '❌ FAIL'
      }
      
      const unit = metric.includes('Score') ? '' : 
                  metric.includes('Shift') ? '' : 'ms'
      
      console.log(`  ${target.label}: ${Math.round(value)}${unit} ${status}`)
    })
  })
  
  // Overall assessment
  const passed = results.every(result => 
    result.performanceScore >= targets.performanceScore.min &&
    result.firstContentfulPaint <= targets.firstContentfulPaint.max &&
    result.largestContentfulPaint <= targets.largestContentfulPaint.max &&
    result.cumulativeLayoutShift <= targets.cumulativeLayoutShift.max &&
    result.timeToInteractive <= targets.timeToInteractive.max
  )
  
  console.log('\n' + '='.repeat(60))
  console.log(passed ? '✅ ALL PERFORMANCE TARGETS MET!' : '❌ Some performance targets not met')
  console.log('='.repeat(60))
  
  if (!passed) {
    console.log('\n💡 Performance improvement suggestions:')
    console.log('  1. Enable compression (gzip/brotli)')
    console.log('  2. Optimize images and use WebP format')
    console.log('  3. Minimize render-blocking resources')
    console.log('  4. Use resource hints (preload, prefetch)')
    console.log('  5. Implement effective caching strategies')
    console.log('  6. Consider using a CDN')
  }
}

// Memory usage monitoring
function monitorMemoryUsage() {
  const formatBytes = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }
  
  const usage = process.memoryUsage()
  console.log('\n💾 Memory Usage:')
  console.log(`  RSS: ${formatBytes(usage.rss)}`)
  console.log(`  Heap Used: ${formatBytes(usage.heapUsed)}`)
  console.log(`  Heap Total: ${formatBytes(usage.heapTotal)}`)
  console.log(`  External: ${formatBytes(usage.external)}`)
}

// Check if server is running
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      console.log('✅ Development server is running\n')
      return true
    }
  } catch (error) {
    console.log('❌ Development server is not running')
    console.log('   Please start the server with: npm run dev\n')
    return false
  }
}

// Main execution
async function main() {
  monitorMemoryUsage()
  
  const serverRunning = await checkServerStatus()
  if (!serverRunning) {
    console.log('💡 Starting performance tests in CI mode...')
    // In CI mode, we would use a static server
  }
  
  await runPerformanceTests()
  
  console.log('\n🎉 Performance testing complete!')
  console.log('📁 Check the performance-reports directory for detailed results')
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error)
  process.exit(1)
})

// Check if running from command line
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { runPerformanceTests, checkPerformanceTargets }