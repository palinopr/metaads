import { NextAuthOptions } from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db/drizzle"

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      authorization: {
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope: "email public_profile",
          response_type: "code",
          client_id: process.env.FACEBOOK_APP_ID!,
        },
      },
      token: {
        url: "https://graph.facebook.com/v18.0/oauth/access_token",
      },
      userinfo: {
        url: "https://graph.facebook.com/me",
        params: {
          fields: "id,name,email,picture",
        },
      },
    }),
  ],
  debug: true, // Enable debug mode
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
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