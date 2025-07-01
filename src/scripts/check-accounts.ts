import { db } from "../db/drizzle"
import { metaAdAccounts, metaConnections } from "../db/schema"
import { eq } from "drizzle-orm"

async function checkAccounts() {
  try {
    console.log("Checking Meta ad accounts...")
    
    // Get all accounts
    const accounts = await db
      .select()
      .from(metaAdAccounts)
    
    console.log(`Found ${accounts.length} accounts`)
    
    for (const account of accounts) {
      console.log("\n---")
      console.log(`Account: ${account.name}`)
      console.log(`Internal ID (UUID): ${account.id}`)
      console.log(`Meta Account ID: ${account.accountId}`)
      console.log(`Is Selected: ${account.isSelected}`)
      console.log(`Is Valid Meta ID: ${account.accountId && /^\d+$/.test(account.accountId)}`)
      
      if (account.accountId && !/^\d+$/.test(account.accountId)) {
        console.log("⚠️  WARNING: Account ID is not in valid Meta format (should be numeric)")
        
        // Check if the accountId looks like a UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(account.accountId)) {
          console.log("❌ ERROR: Account ID contains a UUID instead of Meta's numeric ID")
          console.log("This account needs to be reconnected from Meta")
        }
      }
    }
    
    // Check connections
    console.log("\n\nChecking Meta connections...")
    const connections = await db
      .select({
        id: metaConnections.id,
        userId: metaConnections.userId,
        hasToken: db.raw('access_token IS NOT NULL'),
        expiresAt: metaConnections.expiresAt
      })
      .from(metaConnections)
    
    console.log(`Found ${connections.length} connections`)
    
    for (const conn of connections) {
      console.log("\n---")
      console.log(`Connection ID: ${conn.id}`)
      console.log(`Has Token: ${conn.hasToken}`)
      console.log(`Expires At: ${conn.expiresAt}`)
      
      const isExpired = new Date(conn.expiresAt) < new Date()
      if (isExpired) {
        console.log("⚠️  WARNING: Token is expired")
      }
    }
    
  } catch (error) {
    console.error("Error checking accounts:", error)
  } finally {
    process.exit(0)
  }
}

checkAccounts()