# Factory Truth — www.factorytruth.com

A bilingual platform for factory audit transparency:

- **Factory portal (China)** — Chinese UI. Factories log in and submit answers to audit questions. One submission per account; they can update it anytime. No Google Fonts or Google APIs so the site works in China.
- **Entrepreneur portal (Europe)** — English UI. Hardware startup founders browse factory audits, search and compare factories, and contact factories or request access to private answers.

## Tech stack

- **Next.js 14** (App Router), React 18, TypeScript
- **Fonts**: System fonts only (PingFang SC, Microsoft YaHei for Chinese; system-ui for English). No Google Fonts or external font CDNs.
- **No Google APIs** in the factory flow (no Analytics, Maps, Fonts). Optional Google OAuth for entrepreneur sign-in only.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Main routes

| Route | Description |
|-------|-------------|
| `/` | Landing |
| `/factories` | Factory portal (Chinese) — submit or edit audit |
| `/factories/login`, `/factories/register` | Factory login and registration |
| `/entrepreneurs` | Entrepreneur portal — browse factories |
| `/entrepreneurs/login`, `/entrepreneurs/register` | Entrepreneur login and sign-up (email or Google) |
| `/entrepreneurs/factory/[id]` | Factory detail and contact |
| `/entrepreneurs/compare` | Compare selected factories side by side |
| `/admin` | Admin dashboard (requires admin login) |
| `/admin/login` | Admin login |

---

## Factory portal (Chinese)

- **Company email only**: Only company email addresses can register; personal/free providers (Gmail, QQ, 163, Yahoo, Outlook, etc.) are blocked.
- **One submission per account**: Factories submit answers to audit questions; they can update their submission anytime at `/factories/submissions`.
- **Access requests**: Entrepreneurs can request access to private answers; factories approve or deny at `/factories/access-requests`.
- Set **`JWT_SECRET`** in `.env` (see [Environment variables](#environment-variables)).

---

## Entrepreneur portal (English)

- **Browse**: List of all factories with name, address, and expertise. **Guests** see the first 25 factories; **signed-in** users see the full list.
- **Search**: Signed-in users can search by **name**, **address**, and **expertise**. Filters are reflected in the URL so results are shareable (e.g. `?name=...&expertise=...`).
- **Sort**: By name (A–Z) or date added (newest first). Sort is also in the URL.
- **Sign-in to search/sort**: If not signed in, clicking any search box or the sort control opens a prompt to log in or create a free account. Search and sort do not run until the user is signed in.
- **Compare**: Select up to several factories and compare their answers side by side at `/entrepreneurs/compare`.
- **Factory detail**: Click a factory to see full audit answers (public and, if granted, private), request access to private answers, and ask the factory a question.
- **Auth**: Email/password or Google SSO. Register at `/entrepreneurs/register`, log in at `/entrepreneurs/login`. Optional: set **`GOOGLE_CLIENT_ID`** and **`GOOGLE_CLIENT_SECRET`** and **`NEXT_PUBLIC_APP_URL`** for Google sign-in.

---

## Admin

Set **`ADMIN_EMAIL`** and **`ADMIN_PASSWORD`** in your environment. Then log in at **`/admin/login`**.

- **Edit questions**: Change audit section names and question text (Chinese and English). Stored in `data/audit-questions.json`.
- **Factories**:
  - Create a factory account (email + password).
  - **Bulk import**: Upload a CSV (columns: Company, Address, Expertise) or paste rows. Max 50,000 per import; duplicates by name are skipped. Factories without an email get **`BULK_IMPORT_PLACEHOLDER_EMAIL`** as their account.
  - **Bulk delete**: Remove all factory submissions, access requests, grants, and uploads (type **DELETE ALL** to confirm). User accounts are not deleted.
  - **Edit** a factory’s name, address, and expertise.
  - **Export to CSV**: Download the full factories list (name, address, expertise, email, created, ID).
- **Entrepreneurs**: View registered entrepreneur accounts (if applicable).

---

## Translation (Chinese → English)

Factories submit answers in Chinese. To show entrepreneurs answers in English, set **`DEEPL_AUTH_KEY`** (and optionally **`DEEPL_API_URL`**). Get a key at [DeepL](https://www.deepl.com/pro-api) (free tier available). On each audit submit, answers are translated and stored; the factory detail API returns English to entrepreneurs and Chinese to the factory owner. Without the key, translation is skipped and entrepreneurs see the original Chinese.

---

## Data

Stored under `data/` (JSON files, created as needed):

| File | Purpose |
|------|---------|
| `submissions.json` | Factory audit submissions (one per factory) |
| `users.json` | Factory and entrepreneur account credentials (hashed) |
| `audit-questions.json` | Custom audit questions (after admin edit) |
| `access-requests.json` | Entrepreneur requests for private answers |
| `access-grants.json` | Factory grants for private answers |
| `uploads/` | Uploaded files referenced in submissions |
| `factory-questions/` | Questions from entrepreneurs to factories |

For production at scale you’d replace this with a database.

---

## Environment variables

| Variable | Purpose |
|---------|---------|
| `JWT_SECRET` | Signing session cookies (required; use a long random string) |
| `ADMIN_EMAIL` | Admin login (required for `/admin`) |
| `ADMIN_PASSWORD` | Admin login |
| `NEXT_PUBLIC_APP_URL` | App URL for OAuth redirects (e.g. `https://www.factorytruth.com`) |
| `DEEPL_AUTH_KEY` | DeepL API key for Chinese → English translation (optional) |
| `DEEPL_API_URL` | DeepL API base URL (optional; default free tier) |
| `GOOGLE_CLIENT_ID` | Google OAuth for entrepreneur sign-in (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth for entrepreneur sign-in (optional) |
| `BULK_IMPORT_PLACEHOLDER_EMAIL` | Email used as userId for bulk-imported factories with no email (optional) |

See **`.env.example`** for commented examples.

---

## Deploy

```bash
npm run build
npm start
```

Host on any Node-compatible platform (Vercel, Railway, your own server).

- **Railway**: Persistent disk, custom domain. See **[DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md)** for steps and connecting www.factorytruth.com.
- **China / Hong Kong**: For better access from mainland China, see **[DEPLOY-HK-CHINA.md](./DEPLOY-HK-CHINA.md)** for Docker hosting with Nginx and HTTPS.
