import { db } from "../src/db/drizzle"
import { users } from "../src/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

async function testAdminAuth() {
  console.log("Testing admin authentication...")
  
  try {
    // 1. Check if admin user exists
    const adminUsers = await db.select().from(users).where(eq(users.email, "admin@metaads.com"))
    
    if (adminUsers.length === 0) {
      console.log("❌ Admin user does not exist!")
      
      // Create admin user
      console.log("Creating admin user...")
      const hashedPassword = await bcrypt.hash("Admin123!", 12)
      
      const newUser = await db.insert(users).values({
        email: "admin@metaads.com",
        password: hashedPassword,
        name: "Admin"
      }).returning()
      
      console.log("✅ Admin user created:", newUser[0].id)
      
      // Test the password
      const isValid = await bcrypt.compare("Admin123!", hashedPassword)
      console.log("Password validation test:", isValid ? "✅ PASS" : "❌ FAIL")
    } else {
      const adminUser = adminUsers[0]
      console.log("✅ Admin user exists:", {
        id: adminUser.id,
        email: adminUser.email,
        hasPassword: !!adminUser.password,
        createdAt: adminUser.createdAt
      })
      
      if (adminUser.password) {
        // Test password
        const isValid = await bcrypt.compare("Admin123!", adminUser.password)
        console.log("Password validation:", isValid ? "✅ VALID" : "❌ INVALID")
        
        if (!isValid) {
          console.log("\nUpdating admin password...")
          const newHashedPassword = await bcrypt.hash("Admin123!", 12)
          
          await db.update(users)
            .set({ password: newHashedPassword })
            .where(eq(users.email, "admin@metaads.com"))
          
          console.log("✅ Password updated")
          
          // Test again
          const updatedUser = await db.select().from(users).where(eq(users.email, "admin@metaads.com"))
          const isValidNow = await bcrypt.compare("Admin123!", updatedUser[0].password!)
          console.log("New password validation:", isValidNow ? "✅ VALID" : "❌ INVALID")
        }
      } else {
        console.log("❌ Admin user has no password!")
        
        // Set password
        console.log("Setting admin password...")
        const hashedPassword = await bcrypt.hash("Admin123!", 12)
        
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.email, "admin@metaads.com"))
        
        console.log("✅ Password set")
      }
    }
    
    // List all users
    console.log("\n📋 All users in database:")
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      hasPassword: users.password,
      createdAt: users.createdAt
    }).from(users)
    
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Has password: ${!!user.hasPassword}`)
    })
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    process.exit(0)
  }
}

testAdminAuth()