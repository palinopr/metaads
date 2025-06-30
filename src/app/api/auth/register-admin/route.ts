import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db/drizzle'
import { user } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    // This is a temporary endpoint to create an admin user
    // In production, this should be removed or properly secured
    
    const { email, password, name } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user
    const newUser = await db.insert(user).values({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
    }).returning()
    
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}