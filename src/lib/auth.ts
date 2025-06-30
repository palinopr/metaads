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
          scope: "public_profile email",
          auth_type: "rerequest",
          display: "popup",
        },
      },
      token: {
        url: "https://graph.facebook.com/v18.0/oauth/access_token",
        params: {
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
        },
      },
      userinfo: {
        url: "https://graph.facebook.com/v18.0/me",
        params: {
          fields: "id,name,email,picture.width(250).height(250)",
        },
        async request({ tokens, provider }) {
          const response = await fetch(
            `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture.width(250).height(250)&access_token=${tokens.access_token}`
          );
          return await response.json();
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url || null,
        };
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