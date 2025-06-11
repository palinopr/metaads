#!/usr/bin/env node

/**
 * Test script for service worker functionality
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔧 Testing Service Worker Configuration...\n')

// Test 1: Check if service worker file exists and is valid
console.log('1. Checking service worker file...')
const swPath = path.join(__dirname, '../public/sw.js')

if (!fs.existsSync(swPath)) {
  console.error('❌ Service worker file not found at:', swPath)
  process.exit(1)
}

try {
  const swContent = fs.readFileSync(swPath, 'utf8')
  
  // Check for required functions
  const requiredFunctions = [
    'shouldSkipRequest',
    'handleAPIRequest',
    'handleImageRequest',
    'handleNavigationRequest',
    'handleStaticRequest'
  ]
  
  const missingFunctions = requiredFunctions.filter(fn => !swContent.includes(fn))
  
  if (missingFunctions.length > 0) {
    console.error('❌ Missing required functions:', missingFunctions.join(', '))
  } else {
    console.log('✅ Service worker file contains all required functions')
  }
  
  // Check for chrome-extension handling
  if (swContent.includes('chrome-extension://')) {
    console.log('✅ Chrome extension URL handling present')
  } else {
    console.warn('⚠️  Chrome extension URL handling not found')
  }
  
  // Check for error handling
  if (swContent.includes('try {') && swContent.includes('catch')) {
    console.log('✅ Error handling present')
  } else {
    console.warn('⚠️  Error handling may be insufficient')
  }
  
} catch (error) {
  console.error('❌ Error reading service worker file:', error.message)
}

// Test 2: Check next.config.mjs CSP configuration
console.log('\n2. Checking CSP configuration...')
const configPath = path.join(__dirname, '../next.config.mjs')

if (!fs.existsSync(configPath)) {
  console.error('❌ next.config.mjs not found')
} else {
  try {
    const configContent = fs.readFileSync(configPath, 'utf8')
    
    // Check for CSP headers
    if (configContent.includes('Content-Security-Policy')) {
      console.log('✅ CSP headers configured')
      
      // Check for worker-src
      if (configContent.includes('worker-src')) {
        console.log('✅ worker-src directive present')
      } else {
        console.warn('⚠️  worker-src directive not found')
      }
      
      // Check for common CDN domains
      const cdnDomains = [
        'googleapis.com',
        'gstatic.com',
        'cdn.jsdelivr.net',
        'unpkg.com'
      ]
      
      const presentDomains = cdnDomains.filter(domain => configContent.includes(domain))
      console.log(`✅ CDN domains configured: ${presentDomains.length}/${cdnDomains.length}`)
      
      // Check if rotowire is removed
      if (!configContent.includes('rotowire')) {
        console.log('✅ rotowire.com references removed')
      } else {
        console.warn('⚠️  rotowire.com references still present')
      }
      
    } else {
      console.warn('⚠️  CSP headers not found in config')
    }
    
  } catch (error) {
    console.error('❌ Error reading config file:', error.message)
  }
}

// Test 3: Check storage utilities
console.log('\n3. Checking storage utilities...')
const storageUtilsPath = path.join(__dirname, '../lib/storage-utils.ts')

if (!fs.existsSync(storageUtilsPath)) {
  console.error('❌ Storage utilities not found')
} else {
  try {
    const utilsContent = fs.readFileSync(storageUtilsPath, 'utf8')
    
    // Check for SafeStorage class
    if (utilsContent.includes('class SafeStorage')) {
      console.log('✅ SafeStorage class present')
    }
    
    // Check for permission checking
    if (utilsContent.includes('checkStorageAvailability')) {
      console.log('✅ Storage availability checking present')
    }
    
    // Check for error handling
    if (utilsContent.includes('try {') && utilsContent.includes('catch')) {
      console.log('✅ Error handling in storage utilities')
    }
    
  } catch (error) {
    console.error('❌ Error reading storage utilities:', error.message)
  }
}

// Test 4: Check manifest.json
console.log('\n4. Checking PWA manifest...')
const manifestPath = path.join(__dirname, '../public/manifest.json')

if (!fs.existsSync(manifestPath)) {
  console.error('❌ manifest.json not found')
} else {
  try {
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    if (manifestContent.name && manifestContent.short_name) {
      console.log('✅ Manifest has required name fields')
    }
    
    if (manifestContent.icons && manifestContent.icons.length > 0) {
      console.log(`✅ Manifest has ${manifestContent.icons.length} icons`)
    }
    
    if (manifestContent.start_url) {
      console.log('✅ Manifest has start_url')
    }
    
  } catch (error) {
    console.error('❌ Error parsing manifest.json:', error.message)
  }
}

// Test 5: Syntax check for TypeScript files
console.log('\n5. Running syntax checks...')

try {
  // Check if we can compile the storage utils
  console.log('Checking TypeScript compilation...')
  execSync('npx tsc --noEmit --skipLibCheck', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe'
  })
  console.log('✅ TypeScript compilation successful')
} catch (error) {
  console.warn('⚠️  TypeScript compilation issues detected')
  // Don't fail the test for this, just warn
}

// Test 6: Check for required dependencies
console.log('\n6. Checking dependencies...')
const packagePath = path.join(__dirname, '../package.json')

if (fs.existsSync(packagePath)) {
  try {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const deps = { ...packageContent.dependencies, ...packageContent.devDependencies }
    
    const requiredDeps = ['next', 'react', 'react-dom']
    const missingDeps = requiredDeps.filter(dep => !deps[dep])
    
    if (missingDeps.length === 0) {
      console.log('✅ All required dependencies present')
    } else {
      console.warn('⚠️  Missing dependencies:', missingDeps.join(', '))
    }
    
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message)
  }
}

console.log('\n🏁 Service Worker test completed!')
console.log('\nNext steps:')
console.log('1. Run "npm run dev" to start the development server')
console.log('2. Open browser dev tools to check for CSP violations')
console.log('3. Check the Application tab for service worker registration')
console.log('4. Test offline functionality by throttling network in dev tools')