import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export interface TestAuthConfig {
  enabled: boolean
  bypassEmail?: string
  bypassToken?: string
}

// Test authentication bypass configuration
export const testAuthConfig: TestAuthConfig = {
  enabled: process.env.ENABLE_TEST_AUTH_BYPASS === "true",
  bypassEmail: process.env.TEST_AUTH_BYPASS_EMAIL || "jaime@outletmedia.net",
  bypassToken: process.env.TEST_AUTH_BYPASS_TOKEN || "test-bypass-token",
}

// Middleware to check for test authentication bypass
export async function checkTestAuthBypass(request: NextRequest) {
  if (!testAuthConfig.enabled) {
    return null
  }
  
  // Check for bypass token in headers
  const bypassToken = request.headers.get("X-Test-Auth-Token")
  if (bypassToken === testAuthConfig.bypassToken) {
    console.log("[TEST AUTH BYPASS] Valid bypass token provided")
    return {
      user: {
        email: testAuthConfig.bypassEmail,
        name: "Test Admin User",
        id: "test-user-id",
      },
      isTestBypass: true,
    }
  }
  
  // Check for bypass in query params (for easier testing)
  const url = new URL(request.url)
  const queryBypass = url.searchParams.get("test-auth-token")
  if (queryBypass === testAuthConfig.bypassToken) {
    console.log("[TEST AUTH BYPASS] Valid bypass token in query params")
    return {
      user: {
        email: testAuthConfig.bypassEmail,
        name: "Test Admin User",
        id: "test-user-id",
      },
      isTestBypass: true,
    }
  }
  
  return null
}

// Enhanced session getter with test bypass
export async function getSessionWithBypass(request: NextRequest) {
  // First check for test bypass
  const bypassSession = await checkTestAuthBypass(request)
  if (bypassSession) {
    return bypassSession
  }
  
  // Otherwise use normal authentication
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  if (!token) {
    return null
  }
  
  return {
    user: {
      email: token.email as string,
      name: token.name as string,
      id: token.id as string,
    },
    isTestBypass: false,
  }
}