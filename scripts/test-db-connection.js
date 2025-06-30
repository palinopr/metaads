// Test database connection locally
const DATABASE_URL = "postgresql://postgres.igeuyfuxezvvenxjfnnn:JaimeOrtizPr787!@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

// Parse the URL
try {
  const url = new URL(DATABASE_URL);
  console.log("Database connection details:");
  console.log("Protocol:", url.protocol);
  console.log("Username:", url.username);
  console.log("Password:", url.password);
  console.log("Host:", url.hostname);
  console.log("Port:", url.port);
  console.log("Database:", url.pathname);
  console.log("Params:", url.search);
  
  // Check if password needs encoding
  const encodedPassword = encodeURIComponent("JaimeOrtizPr787!");
  console.log("\nOriginal password:", "JaimeOrtizPr787!");
  console.log("Encoded password:", encodedPassword);
  
  if (url.password !== encodedPassword) {
    console.log("\nWARNING: Password may need URL encoding!");
    console.log("Try using this DATABASE_URL instead:");
    url.password = encodedPassword;
    console.log(url.toString());
  }
} catch (error) {
  console.error("Error parsing DATABASE_URL:", error);
}