// Mock auth configuration for development without database
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptionsMock: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock user for development
        if (credentials?.email === "demo@metaads.com" && credentials?.password === "demo") {
          return {
            id: "1",
            email: "demo@metaads.com",
            name: "Demo User",
            image: null,
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token }) {
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Export a flag to check if using mock auth
export const isUsingMockAuth = true