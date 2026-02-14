import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";

const COOKIE_NAME = "factory_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production"
);
const JWT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Personal/free email domains — only company emails (e.g. @yourfactory.com) can register.
const BLOCKED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "sina.cn",
  "sohu.com",
  "yahoo.com",
  "yahoo.cn",
  "yahoo.com.cn",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "mail.ru",
  "yandex.com",
  "yandex.ru",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "web.de",
  "t-online.de",
  "orange.fr",
  "free.fr",
  "laposte.net",
  "rediffmail.com",
  "outlook.cn",
  "foxmail.com",
  "139.com",
  "189.cn",
  "aliyun.com",
  "yeah.net",
  "tom.com",
  "21cn.com",
  "263.net",
  "3721.net",
]);

function getDomainFromEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at === -1) return null;
  return normalized.slice(at + 1);
}

/** Only company emails are allowed; personal/free providers (gmail, qq, etc.) are blocked. */
export function isEmailAllowed(email: string): boolean {
  const domain = getDomainFromEmail(email);
  if (!domain) return false;
  return !BLOCKED_EMAIL_DOMAINS.has(domain);
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return compare(password, hashed);
}

export async function createSession(email: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Date.now() + JWT_TTL_MS)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifySession(
  token: string
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email as string;
    if (!email) return null;
    return { email };
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
