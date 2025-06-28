import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth(function middleware(req) {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Protect API routes (except auth)
  if (pathname.startsWith("/api") && 
      !pathname.startsWith("/api/auth") && 
      !isLoggedIn) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Protect admin and settings routes
  if ((pathname.startsWith("/admin") || pathname.startsWith("/settings")) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};