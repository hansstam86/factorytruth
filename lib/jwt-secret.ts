/**
 * Central JWT secret for session signing. In production, requires a strong
 * JWT_SECRET to be set (the default "change-me-in-production" is rejected).
 */
let cached: Uint8Array | null = null;

export function getJwtSecret(): Uint8Array {
  if (cached) return cached;
  const raw = process.env.JWT_SECRET ?? "change-me-in-production";
  if (process.env.NODE_ENV === "production") {
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.trim() === "" ||
      process.env.JWT_SECRET === "change-me-in-production"
    ) {
      throw new Error(
        "JWT_SECRET must be set to a strong random value in production. Do not use the default."
      );
    }
  }
  cached = new TextEncoder().encode(raw);
  return cached;
}
