import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req: NextRequest) {
    // Check if this is an admin route
    const isAdminRoute = req.nextUrl.pathname.startsWith("/dashboard/admin") || 
                        req.nextUrl.pathname.startsWith("/api/admin")
    
    if (isAdminRoute) {
      // Get the token from the request
      const token = (req as any).nextauth?.token
      
      // Check if user email is in admin list
      const adminEmails = process.env.ADMIN_EMAILS?.split(",") || ["jaime@outletmedia.com"]
      const userEmail = token?.email as string
      
      if (!userEmail || !adminEmails.includes(userEmail)) {
        // Redirect to dashboard if not admin
        if (req.nextUrl.pathname.startsWith("/dashboard/admin")) {
          return NextResponse.redirect(new URL("/dashboard", req.url))
        }
        // Return 403 for API routes
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*"
  ],
}