#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

let errors = 0;

log('\n🔍 Pre-Deploy Safety Checks\n', colors.blue);

// 1. Check if node_modules exists
log('Checking dependencies...', colors.yellow);
if (fs.existsSync('node_modules')) {
  log('✓ Dependencies installed', colors.green);
} else {
  log('✗ Dependencies not installed - run npm install', colors.red);
  errors++;
}

// 2. Check for .env.local or .env
log('\nChecking environment setup...', colors.yellow);
if (fs.existsSync('.env.local') || fs.existsSync('.env')) {
  log('✓ Environment file found', colors.green);
} else {
  log('⚠ No .env.local file found - create one with your Meta credentials', colors.yellow);
}

// 3. Check if TypeScript compiles
log('\nChecking TypeScript...', colors.yellow);
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  log('✓ TypeScript compiles without errors', colors.green);
} catch (error) {
  log('✗ TypeScript compilation errors found', colors.red);
  errors++;
}

// 4. Check for common issues
log('\nChecking for common issues...', colors.yellow);

// Check for console.logs
try {
  const files = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  
  let consoleCount = 0;
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/console\.(log|error|warn)/g);
      if (matches) consoleCount += matches.length;
    }
  });
  
  if (consoleCount > 20) {
    log(`⚠ Found ${consoleCount} console statements - consider removing for production`, colors.yellow);
  } else {
    log('✓ Acceptable number of console statements', colors.green);
  }
} catch (error) {
  // Ignore find command errors
}

// 5. Check critical files exist
log('\nChecking critical files...', colors.yellow);
const criticalFiles = [
  'app/page.tsx',
  'components/meta-style-dashboard.tsx',
  'lib/meta-api-client.ts',
  'next.config.mjs'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    log(`✓ ${file} exists`, colors.green);
  } else {
    log(`✗ Missing critical file: ${file}`, colors.red);
    errors++;
  }
});

// 6. Try to build
log('\nTesting production build...', colors.yellow);
log('This may take a minute...', colors.yellow);
try {
  execSync('npm run build', { stdio: 'pipe' });
  log('✓ Build successful!', colors.green);
} catch (error) {
  log('✗ Build failed - check for errors above', colors.red);
  errors++;
}

// Summary
log('\n' + '='.repeat(50), colors.blue);
if (errors === 0) {
  log('✅ All checks passed! Safe to deploy.', colors.green);
  log('\nTo deploy, run:', colors.blue);
  log('  npm run start:pm2', colors.yellow);
  process.exit(0);
} else {
  log(`❌ Found ${errors} issues that should be fixed before deployment.`, colors.red);
  process.exit(1);
}