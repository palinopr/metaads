#!/usr/bin/env node

// Test script to verify credential validation fixes
// Run with: node test-credential-validation.js

const BASE_URL = 'http://localhost:3000'

async function testCredentialValidation() {
  console.log('🧪 Testing Meta Ads Dashboard credential validation fixes...\n')

  // Test 1: Test connection with invalid token
  console.log('1. Testing connection with invalid token...')
  try {
    const response = await fetch(`${BASE_URL}/api/meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test_connection',
        accessToken: 'invalid_short_token',
        adAccountId: 'act_123456789'
      })
    })

    const data = await response.json()
    
    if (response.status === 400 && data.error?.includes('too short')) {
      console.log('✅ Invalid token format properly caught')
    } else {
      console.log('❌ Invalid token validation failed:', data)
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message)
  }

  // Test 2: Test connection with invalid account ID
  console.log('\n2. Testing connection with invalid account ID...')
  try {
    const response = await fetch(`${BASE_URL}/api/meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test_connection',
        accessToken: 'EAAabc123validlongtokenformat456789',
        adAccountId: 'invalid_account_id'
      })
    })

    const data = await response.json()
    
    if (response.status === 400 && data.error?.includes('act_')) {
      console.log('✅ Invalid account ID format properly caught')
    } else {
      console.log('❌ Invalid account ID validation failed:', data)
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message)
  }

  // Test 3: Test with properly formatted but fake credentials
  console.log('\n3. Testing connection with properly formatted but fake credentials...')
  try {
    const response = await fetch(`${BASE_URL}/api/meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test_connection',
        accessToken: 'EAAabc123validlongtokenformat456789',
        adAccountId: 'act_123456789'
      })
    })

    const data = await response.json()
    
    if (response.status === 401 && data.error?.includes('OAuth')) {
      console.log('✅ OAuth token error properly handled')
    } else if (!data.success) {
      console.log('✅ Invalid credentials properly rejected:', data.error)
    } else {
      console.log('❌ Fake credentials were accepted:', data)
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message)
  }

  console.log('\n🏁 Test completed!')
  console.log('\nNext steps:')
  console.log('1. Start the development server: npm run dev')
  console.log('2. Visit http://localhost:3000/dashboard')
  console.log('3. Test with your real Meta API credentials')
  console.log('4. Verify that invalid tokens are properly caught and handled')
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`)
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3000')
    console.log('Please start the server with: npm run dev')
    process.exit(1)
  }
  
  await testCredentialValidation()
}

main().catch(console.error)