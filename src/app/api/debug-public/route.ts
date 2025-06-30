import { NextResponse } from 'next/server'

export async function GET() {
  // This is a public endpoint for debugging
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS,
      NEXT_PUBLIC_ADMIN_EMAILS: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
      adminEmailsArray: process.env.ADMIN_EMAILS?.split(",") || [],
      nextPublicAdminEmailsArray: process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [],
    },
    hardcodedChecks: {
      isJaimeNetAdmin: "jaime@outletmedia.net" === "jaime@outletmedia.net",
      adminEmails: ["jaime@outletmedia.net"],
      includes: ["jaime@outletmedia.net"].includes("jaime@outletmedia.net"),
    },
    directChecks: {
      email: "jaime@outletmedia.net",
      isInHardcodedList: ["jaime@outletmedia.net"].includes("jaime@outletmedia.net"),
      isEqual: "jaime@outletmedia.net" === "jaime@outletmedia.net",
    },
    message: "This is a public debug endpoint. Visit /dashboard/admin-test when logged in for more info."
  }
  
  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-store',
    }
  })
}