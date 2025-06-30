import { config } from "dotenv"
import { db } from "../src/db/drizzle"
import { users } from "../src/db/schema"
import bcrypt from "bcryptjs"

// Load environment variables
config({ path: ".env.local" })

async function createAdminUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || "Admin User"

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [name]")
    process.exit(1)
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      emailVerified: new Date(),
    }).returning()

    console.log("Admin user created successfully:")
    console.log("ID:", newUser.id)
    console.log("Email:", newUser.email)
    console.log("Name:", newUser.name)

    process.exit(0)
  } catch (error) {
    console.error("Error creating admin user:", error)
    process.exit(1)
  }
}

createAdminUser()