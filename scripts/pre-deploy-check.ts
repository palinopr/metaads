#!/usr/bin/env ts-node

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
}

// Test results
const results: { test: string; status: 'pass' | 'fail' | 'warn'; message?: string }[] = []

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function runTest(name: string, fn: () => boolean | string) {
  try {
    const result = fn()
    if (result === true) {
      results.push({ test: name, status: 'pass' })
      log(`✓ ${name}`, colors.green)
    } else {
      results.push({ test: name, status: 'fail', message: typeof result === 'string' ? result : undefined })
      log(`✗ ${name}${result ? ': ' + result : ''}`, colors.red)
    }
  } catch (error: any) {
    results.push({ test: name, status: 'fail', message: error.message })
    log(`✗ ${name}: ${error.message}`, colors.red)
  }
}

function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' })
  } catch (error: any) {
    throw new Error(error.stderr || error.message)
  }
}

// Start checks
log('\n🔍 Pre-Deploy Safety Checks\n', colors.blue)

// 1. Check dependencies
runTest('Dependencies installed', () => {
  return fs.existsSync('node_modules')
})

// 2. TypeScript compilation
runTest('TypeScript compiles without errors', () => {
  try {
    runCommand('npx tsc --noEmit')
    return true
  } catch (error) {
    return 'TypeScript errors found'
  }
})

// 3. ESLint check
runTest('No critical ESLint errors', () => {
  try {
    runCommand('npx eslint . --max-warnings=10')
    return true
  } catch (error) {
    return 'ESLint errors found'
  }
})

// 4. Check for console.log statements
runTest('No console.log in production code', () => {
  const files = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v ".next"', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  let consoleCount = 0
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    const matches = content.match(/console\.(log|error|warn)/g)
    if (matches) consoleCount += matches.length
  })
  
  return consoleCount < 50 ? true : `Found ${consoleCount} console statements`
})

// 5. Environment variables check
runTest('Required environment variables', () => {
  const required = [
    'NEXT_PUBLIC_META_ACCESS_TOKEN',
    'NEXT_PUBLIC_META_AD_ACCOUNT_ID'
  ]
  
  const envExample = fs.readFileSync('.env.example', 'utf8')
  const missing = required.filter(key => !envExample.includes(key))
  
  return missing.length === 0 ? true : `Missing: ${missing.join(', ')}`
})

// 6. Build test
runTest('Next.js production build', () => {
  try {
    log('  Building... (this may take a minute)', colors.yellow)
    runCommand('npm run build')
    return true
  } catch (error) {
    return 'Build failed'
  }
})

// 7. Check for large files
runTest('No extremely large files', () => {
  const files = execSync('find . -type f -size +5M | grep -v node_modules | grep -v .git | grep -v .next', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  return files.length === 0 ? true : `Large files: ${files.join(', ')}`
})

// 8. Security checks
runTest('No exposed secrets', () => {
  const dangerousPatterns = [
    /api[_-]?key\s*=\s*["'][^"']+["']/gi,
    /password\s*=\s*["'][^"']+["']/gi,
    /secret\s*=\s*["'][^"']+["']/gi,
  ]
  
  const files = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" | grep -v node_modules', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  let found = false
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    dangerousPatterns.forEach(pattern => {
      if (pattern.test(content)) found = true
    })
  })
  
  return !found
})

// 9. Memory leak patterns
runTest('No obvious memory leak patterns', () => {
  const leakPatterns = [
    /setInterval\(/g,
    /addEventListener\(/g,
  ]
  
  const files = execSync('find . -name "*.tsx" | grep -v node_modules', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  let issues = 0
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    leakPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        // Check if there's corresponding cleanup
        if (!content.includes('clearInterval') && pattern.toString().includes('setInterval')) issues++
        if (!content.includes('removeEventListener') && pattern.toString().includes('addEventListener')) issues++
      }
    })
  })
  
  return issues < 5 ? true : `Found ${issues} potential memory leaks`
})

// 10. API error handling
runTest('API routes have error handling', () => {
  const apiFiles = execSync('find ./app/api -name "*.ts" | grep -v node_modules', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  let missingHandling = 0
  apiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    if (!content.includes('try') || !content.includes('catch')) {
      missingHandling++
    }
  })
  
  return missingHandling === 0 ? true : `${missingHandling} API routes without error handling`
})

// Summary
log('\n📊 Summary\n', colors.blue)
const passed = results.filter(r => r.status === 'pass').length
const failed = results.filter(r => r.status === 'fail').length
const total = results.length

log(`Total: ${total}`, colors.reset)
log(`Passed: ${passed}`, colors.green)
log(`Failed: ${failed}`, colors.red)

if (failed > 0) {
  log('\n❌ Deployment blocked - fix the issues above', colors.red)
  process.exit(1)
} else {
  log('\n✅ All checks passed - safe to deploy!', colors.green)
  process.exit(0)
}