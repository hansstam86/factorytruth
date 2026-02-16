# SSO setup for factorytruth.com (Google Sign-In)

Entrepreneurs can sign in with **Google** on the English portal. This guide configures Google OAuth for **www.factorytruth.com**.

---

## 1. Google Cloud Console

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)** and sign in.
2. Create a project (or select an existing one):
   - Top bar: click the project dropdown → **New Project**.
   - Name it e.g. **Factory Truth** → **Create**.

---

## 2. OAuth consent screen

1. In the left menu: **APIs & Services** → **OAuth consent screen**.
2. Choose **External** (so any Google user can sign in) → **Create**.
3. Fill in:
   - **App name:** Factory Truth
   - **User support email:** your email
   - **Developer contact:** your email
4. **Save and Continue**.
5. **Scopes:** leave default (or add `.../auth/userinfo.email`, `.../auth/userinfo.profile` if you customize). **Save and Continue**.
6. **Test users:** optional for external; add your own email if the app is in “Testing”. **Save and Continue**.

---

## 3. Create OAuth 2.0 credentials

1. **APIs & Services** → **Credentials**.
2. **+ Create Credentials** → **OAuth client ID**.
3. **Application type:** **Web application**.
4. **Name:** e.g. `Factory Truth Web`.
5. **Authorized JavaScript origins:** add both so the site works with and without www:
   - `https://www.factorytruth.com`
   - `https://factorytruth.com`
   - For local dev: `http://localhost:3000` (and `http://localhost:3001` if you use that port).
6. **Authorized redirect URIs:** add both:
   - `https://www.factorytruth.com/api/entrepreneur-auth/sso/callback`
   - `https://factorytruth.com/api/entrepreneur-auth/sso/callback`
   - For local dev: `http://localhost:3000/api/entrepreneur-auth/sso/callback` (and same with `3001` if needed).
7. **Create**.
8. Copy the **Client ID** and **Client secret** (you’ll add these to Railway).

---

## 4. Set variables on Railway

1. Open your **factorytruth** project on [Railway](https://railway.app).
2. Select the service → **Variables**.
3. Add or confirm:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://www.factorytruth.com` |
| `GOOGLE_CLIENT_ID` | (paste Client ID from step 3) |
| `GOOGLE_CLIENT_SECRET` | (paste Client secret from step 3) |

4. Save. Railway will redeploy.

---

## 5. Test

1. Open **https://www.factorytruth.com/entrepreneurs**.
2. Go to **Log in** (or **Register**).
3. Click **Sign in with Google**.
4. Complete the Google sign-in; you should be redirected back to the entrepreneurs area, signed in.

---

## Optional: Railway preview URL

If you also want Google Sign-In on the Railway preview domain (e.g. `*.up.railway.app`):

1. In Google Cloud **Credentials** → your OAuth client → **Edit**.
2. Add to **Authorized JavaScript origins:**  
   `https://your-service-name.up.railway.app`
3. Add to **Authorized redirect URIs:**  
   `https://your-service-name.up.railway.app/api/entrepreneur-auth/sso/callback`
4. Set `NEXT_PUBLIC_APP_URL` to that URL when testing on Railway, or leave as `https://www.factorytruth.com` for production.

---

## Troubleshooting

- **“Google Sign-In is not configured”**  
  `GOOGLE_CLIENT_ID` (and optionally `GOOGLE_CLIENT_SECRET`) are missing or empty in Railway. Add them and redeploy.

- **Redirect URI mismatch**  
  The redirect URI in Google must match exactly the URL the user is on (with or without www). Add both:  
  `https://www.factorytruth.com/api/entrepreneur-auth/sso/callback`  
  `https://factorytruth.com/api/entrepreneur-auth/sso/callback`  
  No trailing slash, correct scheme and host.

- **After login, not signed in**  
  Check that `NEXT_PUBLIC_APP_URL` is `https://www.factorytruth.com` so the session cookie is set for the right domain. Ensure `JWT_SECRET` is set in Railway.
