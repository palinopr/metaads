import { NextAuthOptions } from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"

export const authOptionsMinimal: NextAuthOptions = {
  providers: [
    {
      id: "facebook",
      name: "Facebook",
      type: "oauth",
      version: "2.0",
      authorization: "https://www.facebook.com/v18.0/dialog/oauth?scope=email",
      token: "https://graph.facebook.com/oauth/access_token",
      userinfo: {
        url: "https://graph.facebook.com/me",
        params: { fields: "id,name,email,picture" },
      },
      profile(profile: any) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
        }
      },
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
    }
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}