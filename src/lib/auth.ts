import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[AUTH] Authorize function called")
        console.log("[AUTH] Credentials received:", credentials?.email ? `Email: ${credentials.email}` : "No credentials")
        
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials")
          throw new Error("Invalid credentials")
        }

        try {
          console.log("[AUTH] Querying database for user:", credentials.email)
          const userResults = await db.select().from(users).where(eq(users.email, credentials.email))
          const user = userResults[0]
          console.log("[AUTH] User found:", user ? `ID: ${user.id}` : "No user found")

          if (!user || !user.password) {
            console.log("[AUTH] User not found or missing password")
            throw new Error("User not found")
          }

          console.log("[AUTH] Comparing passwords...")
          console.log("[AUTH] Password exists:", !!user.password)
          console.log("[AUTH] Password length:", user.password?.length)
          
          const isValid = await bcrypt.compare(credentials.password, user.password)
          console.log("[AUTH] Password validation result:", isValid)

          if (!isValid) {
            console.log("[AUTH] Invalid password")
            throw new Error("Invalid password")
          }

          console.log("[AUTH] Authentication successful for:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error("[AUTH] Error during authentication:", error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}