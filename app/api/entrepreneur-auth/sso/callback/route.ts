import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  createSession,
  getSessionCookieName,
  getCookieOptions,
  getSsoStateCookieName,
  getSsoStateCookieOptions,
} from "@/lib/entrepreneur-auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production"
);
const USERS_FILE = path.join(process.cwd(), "data", "entrepreneur-users.json");

type EntrepreneurUser = {
  email: string;
  passwordHash?: string;
  name?: string;
  provider?: string;
  providerId?: string;
  createdAt: string;
};

function getRedirectUri(request: Request): string {
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  return `${origin.replace(/\/$/, "")}/api/entrepreneur-auth/sso/callback`;
}

async function getGoogleUser(code: string, redirectUri: string): Promise<{ email: string; name?: string } | null> {
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
  if (!email) return null;
  return {
    email,
    name: profile.name || undefined,
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
    const { payload } = await jwtVerify(stateToken, JWT_SECRET);
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

  let users: EntrepreneurUser[] = [];
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    users = JSON.parse(raw);
  } catch {
    await mkdir(path.dirname(USERS_FILE), { recursive: true });
  }

  let user = users.find((u) => u.email === googleUser.email);
  if (!user) {
    user = {
      email: googleUser.email,
      name: googleUser.name,
      provider: "google",
      providerId: googleUser.email,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } else if (googleUser.name && !user.name) {
    user.name = googleUser.name;
    const idx = users.findIndex((u) => u.email === googleUser.email);
    if (idx >= 0) {
      users[idx] = { ...users[idx], name: googleUser.name };
      await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    }
  }

  const token = await createSession(googleUser.email, user.name);
  const res = redirectToEntrepreneurs();
  res.cookies.set(getSessionCookieName(), token, getCookieOptions());
  res.cookies.set(getSsoStateCookieName(), "", { ...getSsoStateCookieOptions(), maxAge: 0 });
  return res;
}
