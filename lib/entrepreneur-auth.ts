import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";
import { getJwtSecret } from "@/lib/jwt-secret";

const COOKIE_NAME = "entrepreneur_session";
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
    .sign(getJwtSecret());
}

export async function verifySession(
  token: string
): Promise<{ email: string; name?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
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

/** In production with NEXT_PUBLIC_APP_URL set, return a shared cookie domain (e.g. .factorytruth.com) so session works on both www and apex. */
function getCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url || typeof url !== "string") return undefined;
  try {
    const hostname = new URL(url).hostname;
    if (hostname === "localhost" || hostname.startsWith("127.")) return undefined;
    const parts = hostname.split(".");
    if (parts.length >= 2) return "." + parts.slice(-2).join(".");
  } catch {
    // ignore
  }
  return undefined;
}

export function getCookieOptions() {
  const domain = getCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    ...(domain && { domain }),
  };
}

const SSO_STATE_COOKIE = "entrepreneur_sso_state";

export function getSsoStateCookieName(): string {
  return SSO_STATE_COOKIE;
}

export function getSsoStateCookieOptions() {
  const domain = getCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 minutes
    ...(domain && { domain }),
  };
}
