# Factory Truth — www.factorytruth.com

A bilingual platform for factory audit transparency:

- **Factory portal (China)** — Chinese UI. Factories submit answers to audit questions. No Google Fonts or Google APIs; safe to use in China.
- **Entrepreneur portal (Europe)** — English UI. Hardware startup founders browse factory audit answers and select a factory.

## Tech stack

- **Next.js 14** (App Router), React 18, TypeScript
- **Fonts**: System fonts only (PingFang SC, Microsoft YaHei for Chinese; system-ui for English). No Google Fonts or external font CDNs so the site works in China.
- **No Google APIs** anywhere (no Analytics, Maps, Fonts, etc.).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Landing**: `/`
- **Factory portal (Chinese)**: `/factories` — submit audit answers
- **Entrepreneur portal (English)**: `/entrepreneurs` — browse factories, open a factory to see full audit answers and “Contact this factory”

## Factory login (company email only)

Factories must log in to submit or edit their audit. Only **company email addresses** can register; personal/free providers (Gmail, QQ, 163, Yahoo, Outlook, etc.) are blocked. So e.g. `name@acmefactory.com` is allowed, `name@gmail.com` is not. Set `JWT_SECRET` in `.env.local` (see `.env.example`). Register at `/factories/register`, login at `/factories/login`. One submission per account; they can update it anytime.

## Translation (Chinese → English)

Factories submit answers in Chinese. To show entrepreneurs answers in English, set **`DEEPL_AUTH_KEY`** in `.env.local` (see `.env.example`). Get a key at [DeepL](https://www.deepl.com/pro-api) (free tier available). On each audit submit we translate answers and store them; the factory detail API returns English to entrepreneurs and Chinese to the factory owner. Without the key, translation is skipped and entrepreneurs see the original Chinese.

## Admin (edit questions)

Set **`ADMIN_EMAIL`** and **`ADMIN_PASSWORD`** in `.env.local` (see `.env.example`). Then open **`/admin/login`**, sign in, and go to **Edit questions**. You can change section names and question text (Chinese and English). Changes are saved to `data/audit-questions.json` and used by the factory form and entrepreneur view. Without this file, the app uses the built-in default questions.

## Data

Audit submissions are stored in `data/submissions.json` (created on first submit). Custom audit questions (after admin edit) are in `data/audit-questions.json`. For production you’d replace this with a database and optional auth.

## Deploy

Build and start:

```bash
npm run build
npm start
```

Host on any Node-compatible platform (Vercel, Railway, your own server).

**Railway (recommended):** Persistent disk, easy custom domain. See **[DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md)** for step-by-step deploy and connecting www.factorytruth.com (GoDaddy).

**China / Hong Kong:** For better access from mainland China, host in Hong Kong or China. See **[DEPLOY-HK-CHINA.md](./DEPLOY-HK-CHINA.md)** for step-by-step Docker hosting (HK or mainland, with Nginx + HTTPS).
