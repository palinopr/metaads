import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email))
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await db.insert(users).values({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
    }).returning()

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}