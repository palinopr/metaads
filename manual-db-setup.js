const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the migration file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./drizzle/0000_initial_auth_tables.sql', 'utf8');

    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'account', 'session', 'verificationToken')
    `);

    console.log('\nCreated tables:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

setupDatabase();