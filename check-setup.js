#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 MetaAds Setup Checker\n');

// Check for .env.local
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file exists');
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const hasRealValues = !content.includes('your-') && !content.includes('[user]');
  console.log(hasRealValues ? '✅ Environment variables appear to be configured' : '❌ Environment variables still have placeholder values');
} else {
  console.log('❌ .env.local file not found');
  console.log('   Run: vercel env pull .env.local');
}

// Check .env file
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const hasPlaceholders = content.includes('your-') || content.includes('[user]');
  if (hasPlaceholders) {
    console.log('⚠️  .env file contains placeholder values');
  }
}

// Check node_modules
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('✅ Dependencies installed');
} else {
  console.log('❌ Dependencies not installed');
  console.log('   Run: npm install');
}

// Check for database migrations
if (fs.existsSync(path.join(__dirname, 'drizzle'))) {
  console.log('✅ Database migrations folder exists');
} else {
  console.log('❌ Database migrations folder missing');
}

console.log('\n📋 Next Steps:');
console.log('1. Complete Vercel login: vercel login');
console.log('2. Pull environment variables: vercel env pull .env.local');
console.log('3. Set up database: npm run db:push');
console.log('4. Start dev server: npm run dev');
console.log('5. Visit: http://localhost:3000/api/health');
console.log('\n📖 See FACEBOOK_OAUTH_SETUP.md for OAuth configuration');