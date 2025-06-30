import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// TEMPORARY: Hardcoded admin list that overrides environment variables
const HARDCODED_ADMINS = ["jaime@outletmedia.net"]

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const isAdmin = HARDCODED_ADMINS.includes(session.user.email)
  
  return NextResponse.json({
    email: session.user.email,
    isAdmin,
    hardcodedAdmins: HARDCODED_ADMINS,
    envAdmins: process.env.ADMIN_EMAILS,
    nextPublicEnvAdmins: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
    message: isAdmin ? 'You are an admin!' : 'You are not an admin'
  })
}

// This endpoint can be used to dynamically check admin status
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  // For now, always return true for jaime@outletmedia.net
  if (session.user.email === "jaime@outletmedia.net") {
    return NextResponse.json({ 
      isAdmin: true,
      message: 'Admin access granted via override'
    })
  }
  
  return NextResponse.json({ 
    isAdmin: false,
    message: 'Not an admin'
  })
}