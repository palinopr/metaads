import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("Starting schema fix...")
    
    // Check if the table needs to be recreated
    const tableCheck = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'meta_ad_accounts'
      ORDER BY ordinal_position
    `)
    
    console.log("Current columns:", tableCheck.rows)
    
    // Check if we need to migrate
    const hasTimezoneColumn = tableCheck.rows.some((col: any) => col.column_name === 'timezone')
    const hasTimezoneName = tableCheck.rows.some((col: any) => col.column_name === 'timezone_name')
    const hasIsActive = tableCheck.rows.some((col: any) => col.column_name === 'is_active')
    
    const needsMigration = hasTimezoneColumn || !hasTimezoneName || !hasIsActive
    
    if (needsMigration) {
      console.log("Migration needed. Backing up existing data...")
      
      // First, backup existing data
      const existingData = await db.execute(sql`
        SELECT * FROM meta_ad_accounts
      `)
      
      console.log(`Found ${existingData.rows.length} existing records`)
      
      // Drop and recreate the table
      await db.execute(sql`DROP TABLE IF EXISTS meta_ad_accounts CASCADE`)
      
      await db.execute(sql`
        CREATE TABLE meta_ad_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          account_id TEXT NOT NULL,
          user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          connection_id UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          currency TEXT,
          timezone_name TEXT,
          is_active BOOLEAN DEFAULT true,
          is_selected BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, account_id)
        )
      `)
      
      // Create indexes
      await db.execute(sql`CREATE INDEX idx_meta_ad_accounts_user_id ON meta_ad_accounts(user_id)`)
      await db.execute(sql`CREATE INDEX idx_meta_ad_accounts_selected ON meta_ad_accounts(user_id, is_selected) WHERE is_selected = true`)
      await db.execute(sql`CREATE INDEX idx_meta_ad_accounts_connection ON meta_ad_accounts(connection_id)`)
      
      console.log("Table recreated successfully")
      
      // Restore data if any existed
      if (existingData.rows.length > 0) {
        for (const row of existingData.rows) {
          await db.execute(sql`
            INSERT INTO meta_ad_accounts (
              account_id,
              user_id,
              connection_id,
              name,
              currency,
              timezone_name,
              is_active,
              is_selected,
              created_at,
              updated_at
            ) VALUES (
              ${row.account_id},
              ${row.user_id},
              ${row.connection_id},
              ${row.name},
              ${row.currency},
              ${row.timezone || row.timezone_name},
              ${row.is_active !== undefined ? row.is_active : true},
              ${row.is_selected || false},
              ${row.created_at},
              ${row.updated_at}
            )
          `)
        }
        console.log(`Restored ${existingData.rows.length} records`)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Schema fixed successfully",
        migratedRecords: existingData.rows.length
      })
    } else {
      return NextResponse.json({ 
        success: true, 
        message: "Schema is already up to date" 
      })
    }
    
  } catch (error) {
    console.error('Error fixing schema:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fix schema' },
      { status: 500 }
    )
  }
}