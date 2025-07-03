import { db } from "../src/db/drizzle"
import { metaAdAccounts } from "../src/db/schema"
import { eq, like, sql } from "drizzle-orm"
import { parseMetaAccountId, isValidMetaAccountId } from "../src/lib/meta/account-utils"

async function fixMetaAccountIds() {
  console.log("Starting Meta Account ID migration...")
  
  try {
    // Get all accounts
    const accounts = await db
      .select()
      .from(metaAdAccounts)
    
    console.log(`Found ${accounts.length} total accounts`)
    
    let fixedCount = 0
    let skippedCount = 0
    
    for (const account of accounts) {
      // Check if account ID needs fixing
      if (account.accountId) {
        // If it starts with act_, remove it
        if (account.accountId.startsWith('act_')) {
          const numericId = parseMetaAccountId(account.accountId)
          
          console.log(`Fixing account ${account.name}: ${account.accountId} -> ${numericId}`)
          
          await db
            .update(metaAdAccounts)
            .set({ 
              accountId: numericId,
              updatedAt: new Date()
            })
            .where(eq(metaAdAccounts.id, account.id))
          
          fixedCount++
        }
        // Validate the format
        else if (!isValidMetaAccountId(account.accountId)) {
          console.warn(`Invalid account ID format for ${account.name}: ${account.accountId}`)
          skippedCount++
        }
      }
    }
    
    console.log("\nMigration completed:")
    console.log(`- Fixed: ${fixedCount} accounts`)
    console.log(`- Skipped: ${skippedCount} accounts (invalid format)`)
    console.log(`- Unchanged: ${accounts.length - fixedCount - skippedCount} accounts`)
    
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

// Run migration
fixMetaAccountIds()
  .then(() => {
    console.log("\nMigration completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\nMigration failed:", error)
    process.exit(1)
  })