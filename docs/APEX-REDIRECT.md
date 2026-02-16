# Redirect factorytruth.com → www.factorytruth.com

You want **factorytruth.com** (no www) to redirect to **www.factorytruth.com**.  
Railway needs a **CNAME** to connect domains; **GoDaddy does not allow CNAME at the apex** (root domain). So you have two options.

---

## Option A: GoDaddy domain forwarding (simplest)

Use GoDaddy’s **forwarding** so that anyone opening `factorytruth.com` is redirected to `www.factorytruth.com` before any request hits Railway. No apex DNS record needed.

1. Log in to **GoDaddy** → **My Products** → select **factorytruth.com**.
2. Open **Domain** settings (or **Manage DNS** / **Forwarding** depending on the UI).
3. Find **Forwarding** or **Domain Forwarding** or **Redirect domain**.
4. Add a forward:
   - **From:** `factorytruth.com` (or “@” / root).
   - **To:** `https://www.factorytruth.com`
   - **Type:** **Permanent (301)** if available.
   - **Settings:** “Forward only” (don’t show the URL in the address bar).
5. Save. Propagation can take a few minutes to an hour.

Result: visiting **factorytruth.com** or **http://factorytruth.com** sends users to **https://www.factorytruth.com**. Your app and Railway only need to serve **www.factorytruth.com** (which you already set up with a CNAME for `www`).

---

## Option B: Use Cloudflare so apex points to Railway (then app redirects)

If you want **factorytruth.com** to actually resolve to Railway (and your Next.js app to do the redirect), you need a DNS provider that supports a CNAME at the apex (e.g. **Cloudflare**). You keep the domain at GoDaddy and only change **nameservers** to Cloudflare.

### 1. Add the domain in Cloudflare

1. Sign up at **[cloudflare.com](https://www.cloudflare.com)**.
2. **Add a site** → enter **factorytruth.com** → choose the **Free** plan.
3. Cloudflare will show a list of your current DNS records (they import from GoDaddy). Review and continue.

### 2. Point the apex to Railway with CNAME flattening

1. In Cloudflare → **factorytruth.com** → **DNS** → **Records**.
2. Add a record for the **apex** (root):
   - **Type:** **CNAME** (Cloudflare allows this at the apex via “flattening”).
   - **Name:** `@` (or `factorytruth.com`).
   - **Target:** the **same** Railway CNAME target you use for www (e.g. `your-app.up.railway.app`).
   - **Proxy status:** **DNS only** (grey cloud) at first so SSL can provision; you can turn on the orange cloud later if you want.
3. Ensure **www** also points to Railway:
   - **Type:** CNAME  
   - **Name:** `www`  
   - **Target:** same Railway CNAME target.

### 3. Switch nameservers at GoDaddy

1. In Cloudflare, go to **Overview** and copy the **two nameservers** (e.g. `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`).
2. In **GoDaddy** → **factorytruth.com** → **Manage** → **Nameservers** → **Change**.
3. Choose **Custom** and enter the two Cloudflare nameservers. Save.
4. Wait for propagation (often 15 minutes to 48 hours).

### 4. Add both domains in Railway

1. In **Railway** → your service → **Settings** → **Networking** / **Domains**.
2. Add **www.factorytruth.com** (you likely have this already).
3. Add **factorytruth.com** (apex).
4. Railway will show the same CNAME target for both. Your Cloudflare CNAME for `@` already points there.

Once DNS is correct, requests to **factorytruth.com** hit your app; the redirect in **next.config.js** sends them to **https://www.factorytruth.com**.

---

## Summary

| Goal | Easiest approach |
|------|-------------------|
| factorytruth.com → www.factorytruth.com | **Option A:** GoDaddy domain forwarding to `https://www.factorytruth.com`. |
| Apex and www both resolve to Railway, app does redirect | **Option B:** Cloudflare DNS (CNAME at apex) + add both domains in Railway. |

For most cases, **Option A** is enough: users typing **factorytruth.com** end up on **www.factorytruth.com** with no extra DNS or Railway config.
