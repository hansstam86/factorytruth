# Deploy Factory Truth on Railway

This guide gets the app live on [Railway](https://railway.app) with persistent storage, then connects **www.factorytruth.com** (GoDaddy).

---

## 1. Push your code to GitHub

Ensure your project is in a GitHub repo. Railway deploys from Git.

```bash
git add .
git commit -m "Prepare for Railway deploy"
git push origin main
```

(Don’t commit `.env.local` — use Railway’s environment variables instead.)

---

## 2. Create a Railway project and deploy

1. Go to **[railway.app](https://railway.app)** and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo**.
3. Select your **factorytruth** repo. Railway will detect Next.js.
4. After the first deploy, open the service (click it) and go to **Settings**.

---

## 3. Add a persistent volume (required)

The app stores submissions, uploads, and JSON files on disk. Without a volume, data is lost on every deploy.

1. In your service, open the **Variables** tab (or **Settings**).
2. Click **+ New** → **Volume** (or use the volume option in the dashboard).
3. Create a volume and set the **mount path** to:
   ```text
   data
   ```
   (Railway will mount it at `/app/data` where the app writes.)

4. Save. Redeploy if Railway doesn’t do it automatically.

---

## 4. Set environment variables

In the same service: **Variables** → **+ New Variable** (or **Raw Editor**). Add:

| Variable | Value | Required |
|----------|--------|----------|
| `JWT_SECRET` | Long random string (e.g. 32+ chars) | Yes |
| `ADMIN_EMAIL` | Your admin email | Yes (for /admin) |
| `ADMIN_PASSWORD` | Your admin password | Yes |
| `NEXT_PUBLIC_APP_URL` | `https://www.factorytruth.com` | Yes (for OAuth/redirects) |
| `DEEPL_AUTH_KEY` | Your DeepL key (if you use translation) | No |
| `GOOGLE_CLIENT_ID` | For entrepreneur Google login | No |
| `GOOGLE_CLIENT_SECRET` | For entrepreneur Google login | No |

Generate a strong `JWT_SECRET` (e.g. `openssl rand -base64 32`).

If you use Google SSO, set the OAuth redirect URI in Google Cloud Console to:

```text
https://www.factorytruth.com/api/entrepreneur-auth/sso/callback
```

Save. Railway will redeploy when variables change.

---

## 5. Get your Railway URL and enable HTTPS

1. In the service, open **Settings** → **Networking** (or **Generate Domain**).
2. Click **Generate Domain**. You’ll get a URL like `factorytruth-production-xxxx.up.railway.app`.
3. Railway provides HTTPS for this domain. Open it and confirm the app loads (register, login, etc.).

---

## 6. Add your custom domain (www.factorytruth.com)

1. In the same **Networking** section, click **Custom Domain**.
2. Enter: `www.factorytruth.com` (and optionally `factorytruth.com`).
3. Railway will show a **CNAME** target, e.g.:
   ```text
   factorytruth-production-xxxx.up.railway.app
   ```
   (Or they may give a different format — use the value Railway shows.)

---

## 7. Point GoDaddy DNS to Railway

1. Log in to **GoDaddy** → your domain **factorytruth.com** → **DNS** or **Manage DNS**.
2. Add or edit:

   **For www:**

   - **Type:** CNAME  
   - **Name:** `www`  
   - **Value:** the Railway CNAME target (e.g. `factorytruth-production-xxxx.up.railway.app`)  
   - **TTL:** 600 (or default)

   **For root (factorytruth.com) — optional:**

   - Railway often recommends a CNAME for root too, or an A record. Follow the exact instructions Railway shows for the root domain.

3. Save. Wait 5–60 minutes for DNS to propagate.

---

## 8. Turn on HTTPS for the custom domain

Once DNS is correct, Railway will issue a certificate for `www.factorytruth.com`. Check the **Custom Domain** section; it may show “Certificate active” or “Pending”. If it stays pending, confirm the CNAME in GoDaddy and wait a bit longer.

Then open **https://www.factorytruth.com** and test the full flow (factory login, entrepreneur login, admin, file uploads).

---

## Summary checklist

| Step | Action |
|------|--------|
| 1 | Push code to GitHub |
| 2 | Railway → New Project → Deploy from GitHub repo |
| 3 | Add **Volume** with mount path `data` |
| 4 | Set **Variables**: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL` (+ optional DeepL, Google) |
| 5 | Generate Railway domain, test the app |
| 6 | Add custom domain `www.factorytruth.com` in Railway |
| 7 | In GoDaddy DNS: CNAME `www` → Railway’s target |
| 8 | Wait for DNS + SSL, then use https://www.factorytruth.com |

---

## Updating the app

Push to your GitHub branch (e.g. `main`). Railway will rebuild and redeploy. The volume keeps submissions, uploads, and users across deploys.

## Backups

Data lives in the Railway volume. Use Railway’s backup/export if available, or add a cron/job that copies `data/` to external storage (e.g. S3) if you need your own backups.
