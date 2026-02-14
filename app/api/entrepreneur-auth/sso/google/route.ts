import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import {
  getSsoStateCookieName,
  getSsoStateCookieOptions,
} from "@/lib/entrepreneur-auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production"
);

function getRedirectUri(request: Request): string {
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  return `${origin.replace(/\/$/, "")}/api/entrepreneur-auth/sso/callback`;
}

export async function GET(request: Request) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google Sign-In is not configured." },
      { status: 503 }
    );
  }

  const state = crypto.randomUUID();
  const stateToken = await new SignJWT({ state })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(JWT_SECRET);

  const redirectUri = getRedirectUri(request);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: stateToken,
    access_type: "offline",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  res.cookies.set(getSsoStateCookieName(), stateToken, getSsoStateCookieOptions());
  return res;
}
