const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Checking users in database...\n');

    // Get all users
    const usersResult = await client.query('SELECT * FROM "user" ORDER BY "emailVerified" DESC NULLS LAST');
    
    if (usersResult.rows.length === 0) {
      console.log('No users found in database yet.');
    } else {
      console.log(`Found ${usersResult.rows.length} user(s):\n`);
      usersResult.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Name: ${user.name || 'Not set'}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Email Verified: ${user.emailVerified || 'No'}`);
        console.log(`- Image: ${user.image ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // Get all accounts (OAuth connections)
    const accountsResult = await client.query('SELECT * FROM "account"');
    
    if (accountsResult.rows.length > 0) {
      console.log(`\nFound ${accountsResult.rows.length} OAuth connection(s):\n`);
      accountsResult.rows.forEach((account, index) => {
        console.log(`Connection ${index + 1}:`);
        console.log(`- Provider: ${account.provider}`);
        console.log(`- User ID: ${account.userId}`);
        console.log(`- Provider Account ID: ${account.providerAccountId}`);
        console.log('');
      });
    }

    // Get active sessions
    const sessionsResult = await client.query('SELECT * FROM "session" WHERE expires > NOW()');
    
    if (sessionsResult.rows.length > 0) {
      console.log(`\nFound ${sessionsResult.rows.length} active session(s).`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();