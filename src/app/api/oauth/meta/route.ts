import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FACEBOOK_OAUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/oauth/meta/callback`;

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.currentOrganizationId) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: REDIRECT_URI,
    state: session.user.currentOrganizationId,
    scope: "ads_read,ads_management,business_management,pages_read_engagement",
    response_type: "code",
  });

  const oauthUrl = `${FACEBOOK_OAUTH_URL}?${params.toString()}`;
  
  return NextResponse.redirect(oauthUrl);
}