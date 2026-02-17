import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  createSession,
  getSessionCookieName,
  getCookieOptions,
  getSsoStateCookieName,
  getSsoStateCookieOptions,
} from "@/lib/entrepreneur-auth";
import { getJwtSecret } from "@/lib/jwt-secret";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getRedirectUri(request: Request): string {
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  return `${origin.replace(/\/$/, "")}/api/entrepreneur-auth/sso/callback`;
}

async function getGoogleUser(
  code: string,
  redirectUri: string
): Promise<{ email: string; name?: string; googleId: string } | null> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Google token error", tokenRes.status, err);
    return null;
  }
  const tokens = await tokenRes.json();
  const accessToken = tokens.access_token;
  if (!accessToken) return null;

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) return null;
  const profile = await userRes.json();
  const email = profile.email?.trim().toLowerCase();
  const googleId = profile.id ?? email;
  if (!email) return null;
  return {
    email,
    name: profile.name || undefined,
    googleId: String(googleId),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectToEntrepreneurs = () =>
    NextResponse.redirect(`${baseUrl.replace(/\/$/, "")}/entrepreneurs`);

  if (!code || !stateToken) {
    return redirectToEntrepreneurs();
  }

  try {
    const cookieStore = await cookies();
    const savedState = cookieStore.get(getSsoStateCookieName())?.value;
    if (!savedState || savedState !== stateToken) {
      return redirectToEntrepreneurs();
    }
    const { payload } = await jwtVerify(stateToken, getJwtSecret());
    if (!payload.state) return redirectToEntrepreneurs();
  } catch {
    return redirectToEntrepreneurs();
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return redirectToEntrepreneurs();
  }

  const redirectUri = getRedirectUri(request);
  const googleUser = await getGoogleUser(code, redirectUri);
  if (!googleUser) {
    return redirectToEntrepreneurs();
  }

  let user = await prisma.entrepreneurUser.findFirst({
    where: {
      OR: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
    },
  });
  if (!user) {
    user = await prisma.entrepreneurUser.create({
      data: {
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
      },
    });
  } else if (googleUser.name && !user.name) {
    user = await prisma.entrepreneurUser.update({
      where: { id: user.id },
      data: { name: googleUser.name },
    });
  } else if (!user.googleId) {
    await prisma.entrepreneurUser.update({
      where: { id: user.id },
      data: { googleId: googleUser.googleId },
    });
  }

  const token = await createSession(googleUser.email, user.name ?? undefined);
  const res = redirectToEntrepreneurs();
  res.cookies.set(getSessionCookieName(), token, getCookieOptions());
  res.cookies.set(getSsoStateCookieName(), "", { ...getSsoStateCookieOptions(), maxAge: 0 });
  return res;
}
