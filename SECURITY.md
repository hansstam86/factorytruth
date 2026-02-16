# Security

## Measures in place

- **Sessions**: JWTs in httpOnly, secure (in production), SameSite=Lax cookies. Separate cookies for factory, entrepreneur, and admin.
- **JWT secret**: In production, the app will not start unless `JWT_SECRET` is set and is not the default `change-me-in-production` (see `lib/jwt-secret.ts`).
- **Auth**: Admin routes require admin session; factory routes require factory session; entrepreneur-only routes use entrepreneur session. Public list `/api/factories` returns only id, name, address, expertise, createdAt (no email/userId).
- **Path traversal**: File serving (`/api/submission-file`) validates that the requested path resolves inside `data/`. Audit file uploads (`/api/submit-audit`) restrict question IDs to safe characters and ensure written paths stay inside the submission upload directory.
- **File uploads**: Max 25 MB per file; allowed extensions: pdf, ppt, pptx, xls, xlsx, jpg, jpeg, png, gif, webp. Filenames sanitized (alphanumeric, dots, underscores, hyphens only; max 100 chars).
- **Bulk delete**: Requires exact body `{ confirm: "DELETE ALL" }` and admin session.
- **XSS**: No `dangerouslySetInnerHTML` or raw HTML injection; React escapes by default.
- **Factory registration**: Only company emails allowed (blocked list of free/personal domains).

## Recommendations

- **Rate limiting**: Consider adding rate limits on login, registration, and submit-audit endpoints (e.g. per IP or per account) to reduce brute-force and abuse.
- **Admin password**: Keep `ADMIN_PASSWORD` strong and only in environment; avoid sharing. Consider rotating periodically.
- **HTTPS**: Always use HTTPS in production; cookies use `secure: true` when `NODE_ENV === "production"`.
- **Dependencies**: Run `npm audit` periodically and update packages for known vulnerabilities.
