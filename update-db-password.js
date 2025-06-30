const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateDatabase() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    console.log('Adding password column to users table...');
    await client.connect();
    
    // Add password column if it doesn't exist
    await client.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS password TEXT,
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()
    `);
    
    // Add unique constraint on email if it doesn't exist
    await client.query(`
      ALTER TABLE "user" 
      ADD CONSTRAINT user_email_unique UNIQUE (email)
    `).catch(e => {
      if (e.code !== '42710') { // Constraint already exists
        throw e;
      }
    });
    
    console.log('✅ Database updated successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateDatabase();