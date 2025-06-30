"use client"

import { useSession } from "next-auth/react"

export default function DebugAdminPage() {
  const { data: session } = useSession()
  
  // Direct hardcoded check for debugging
  const isAdmin = session?.user?.email === "jaime@outletmedia.net"
  const adminEmails = ["jaime@outletmedia.net"]
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Debug Admin Access</h1>
      
      <div className="space-y-2">
        <p><strong>Your email:</strong> {session?.user?.email || "Not logged in"}</p>
        <p><strong>Admin emails from env:</strong> {process.env.NEXT_PUBLIC_ADMIN_EMAILS || "Not set"}</p>
        <p><strong>Admin emails (with fallback):</strong> {adminEmails.join(", ")}</p>
        <p><strong>Are you admin?</strong> {isAdmin ? "Yes" : "No"}</p>
      </div>
      
      <div className="mt-4 p-4 bg-muted rounded">
        <p className="text-sm">
          If you don't see the admin panel, make sure:
          <ul className="list-disc list-inside mt-2">
            <li>You're logged in with the correct email</li>
            <li>Your email matches exactly (case-sensitive)</li>
            <li>The NEXT_PUBLIC_ADMIN_EMAILS environment variable is set</li>
          </ul>
        </p>
      </div>
    </div>
  )
}