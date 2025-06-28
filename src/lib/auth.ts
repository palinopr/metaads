import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const validatedFields = loginSchema.safeParse(credentials);
        if (!validatedFields.success) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            organizations: {
              include: {
                organization: true,
              },
            },
          },
        });

        if (!user || !user.isActive) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          emailVerified: user.isEmailVerified ? new Date() : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      if (user) {
        token.id = user.id;
        
        // Get user's organizations
        const userOrgs = await prisma.userOrganization.findMany({
          where: { userId: user.id },
          include: { organization: true },
        });

        token.organizations = userOrgs.map((uo) => ({
          id: uo.organization.id,
          name: uo.organization.name,
          slug: uo.organization.slug,
          role: uo.role,
        }));

        // Set default organization (first one or most recently joined)
        if (userOrgs.length > 0) {
          token.currentOrganizationId = userOrgs[0].organizationId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.organizations = token.organizations as any;
        session.user.currentOrganizationId = token.currentOrganizationId as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});

// Type augmentation for NextAuth
declare module "next-auth" {
  interface User {
    id: string;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      organizations?: Array<{
        id: string;
        name: string;
        slug: string;
        role: string;
      }>;
      currentOrganizationId?: string;
    };
  }
}

declare module "@auth/core/types" {
  interface JWT {
    id: string;
    organizations?: Array<{
      id: string;
      name: string;
      slug: string;
      role: string;
    }>;
    currentOrganizationId?: string;
  }
}