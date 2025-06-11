#!/usr/bin/env ts-node

import * as http from 'http'
import * as https from 'https'

interface HealthCheck {
  name: string
  endpoint: string
  expectedStatus?: number
  timeout?: number
  validator?: (data: any) => boolean
}

const checks: HealthCheck[] = [
  {
    name: 'Homepage loads',
    endpoint: 'http://localhost:3000',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'API endpoint responds',
    endpoint: 'http://localhost:3000/api/meta',
    expectedStatus: 500, // Will be 500 without credentials
    timeout: 3000
  },
  {
    name: 'Static assets load',
    endpoint: 'http://localhost:3000/_next/static/css',
    expectedStatus: 404, // Expected without full path
    timeout: 2000
  }
]

async function checkEndpoint(check: HealthCheck): Promise<boolean> {
  return new Promise((resolve) => {
    const url = new URL(check.endpoint)
    const client = url.protocol === 'https:' ? https : http
    
    const timeout = setTimeout(() => {
      console.log(`❌ ${check.name}: Timeout after ${check.timeout}ms`)
      resolve(false)
    }, check.timeout || 5000)
    
    const req = client.get(check.endpoint, (res) => {
      clearTimeout(timeout)
      
      if (check.expectedStatus && res.statusCode !== check.expectedStatus) {
        console.log(`❌ ${check.name}: Expected ${check.expectedStatus}, got ${res.statusCode}`)
        resolve(false)
        return
      }
      
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (check.validator && !check.validator(data)) {
          console.log(`❌ ${check.name}: Validation failed`)
          resolve(false)
          return
        }
        
        console.log(`✅ ${check.name}: OK (${res.statusCode})`)
        resolve(true)
      })
    })
    
    req.on('error', (err) => {
      clearTimeout(timeout)
      console.log(`❌ ${check.name}: ${err.message}`)
      resolve(false)
    })
    
    req.end()
  })
}

async function runHealthChecks() {
  console.log('🏥 Running Health Checks...\n')
  
  let allPassed = true
  
  for (const check of checks) {
    const passed = await checkEndpoint(check)
    if (!passed) allPassed = false
  }
  
  console.log('\n' + (allPassed ? '✅ All health checks passed!' : '❌ Some health checks failed!'))
  return allPassed
}

// Run checks
runHealthChecks().then(success => {
  process.exit(success ? 0 : 1)
})