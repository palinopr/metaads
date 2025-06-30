require('dotenv').config({ path: '.env.local' });

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DIRECT_URL exists:', !!process.env.DIRECT_URL);

if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL format check:');
  console.log('- Starts with postgresql://:', url.startsWith('postgresql://'));
  console.log('- Contains @:', url.includes('@'));
  console.log('- Length:', url.length);
}

if (process.env.DIRECT_URL) {
  const url = process.env.DIRECT_URL;
  console.log('\nDIRECT_URL format check:');
  console.log('- Starts with postgresql://:', url.startsWith('postgresql://'));
  console.log('- Contains @:', url.includes('@'));
  console.log('- Length:', url.length);
}