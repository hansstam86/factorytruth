import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/jwt-secret";

const COOKIE_NAME = "admin_session";
const JWT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getAdminSessionCookieName(): string {
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

export function getAdminCookieOptions() {
  const domain = getCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    ...(domain && { domain }),
  };
}

export async function createAdminSession(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Date.now() + JWT_TTL_MS)
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function verifyAdminSession(
  token: string
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.admin !== true) return null;
    const email = payload.email as string;
    if (!email) return null;
    return { email };
  } catch {
    return null;
  }
}

export function isAdminConfigured(): boolean {
  return !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export function checkAdminCredentials(email: string, password: string): boolean {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  return email.trim().toLowerCase() === adminEmail && password === adminPassword;
}
