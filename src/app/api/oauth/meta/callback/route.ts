import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // organizationId
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${error}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_params", request.url)
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/meta/callback`,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const { access_token, expires_in } = await tokenResponse.json();

    // Get user's ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency,account_status&access_token=${access_token}`
    );

    if (!accountsResponse.ok) {
      throw new Error("Failed to fetch ad accounts");
    }

    const { data: adAccounts } = await accountsResponse.json();

    // Save accounts to database
    for (const account of adAccounts) {
      await prisma.metaAccount.upsert({
        where: {
          organizationId_accountId: {
            organizationId: state,
            accountId: account.id,
          },
        },
        update: {
          accountName: account.name,
          accessToken: access_token, // In production, encrypt this!
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
          isActive: account.account_status === 1,
          lastSyncedAt: new Date(),
        },
        create: {
          organizationId: state,
          accountId: account.id,
          accountName: account.name,
          accessToken: access_token, // In production, encrypt this!
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
          isActive: account.account_status === 1,
        },
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard?success=meta_connected", request.url)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=connection_failed", request.url)
    );
  }
}