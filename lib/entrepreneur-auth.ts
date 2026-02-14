import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";

const COOKIE_NAME = "entrepreneur_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production"
);
const JWT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return compare(password, hashed);
}

export async function createSession(email: string, name?: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), name: name || null })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Date.now() + JWT_TTL_MS)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifySession(
  token: string
): Promise<{ email: string; name?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email as string;
    if (!email) return null;
    return { email, name: (payload.name as string) || undefined };
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

const SSO_STATE_COOKIE = "entrepreneur_sso_state";

export function getSsoStateCookieName(): string {
  return SSO_STATE_COOKIE;
}

export function getSsoStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  };
}
