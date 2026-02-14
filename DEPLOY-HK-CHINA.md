# Hosting in Hong Kong or China

This guide gets Factory Truth running on a server in **Hong Kong** (no ICP filing) or **mainland China** (ICP required). The app runs in Docker so you can use any VM provider.

---

## Option A: Hong Kong (recommended first — no ICP)

### 1. Create a server (VM)

Pick one and create an **Ubuntu 22.04** VM in a **Hong Kong** region:

| Provider        | Product        | Region   | Notes                    |
|----------------|----------------|----------|---------------------------|
| **Alibaba Cloud** | ECS            | Hong Kong | aliyun.com               |
| **Tencent Cloud** | CVM            | Hong Kong | cloud.tencent.com         |
| **Vultr**      | Cloud Compute   | Hong Kong | vultr.com                 |
| **AWS**        | EC2             | ap-east-1 (Hong Kong) | console.aws.amazon.com |

- **Size:** 1 vCPU, 1–2 GB RAM is enough to start.
- **SSH:** Add your SSH key so you can log in: `ssh root@YOUR_SERVER_IP` (or `ubuntu@...` if you use Ubuntu user).

### 2. Install Docker on the server

SSH in and run:

```bash
# Update and install Docker
apt update && apt install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update && apt install -y docker-ce docker-ce-cli containerd.io
```

### 3. Deploy the app

On your **local machine** (where the Factory Truth code is), build the image and push to a registry, **or** build on the server.

**Option 3a — Build on server (simplest):**

```bash
# From your project root (factorytruth/)
cd /path/to/factorytruth

# Copy the project to the server (or clone from Git)
rsync -avz --exclude node_modules --exclude .next . root@YOUR_SERVER_IP:/opt/factorytruth/
ssh root@YOUR_SERVER_IP "cd /opt/factorytruth && docker build -t factorytruth ."
```

**Option 3b — Push from your machine, pull on server:**

```bash
# On your machine: build and tag for Docker Hub (or another registry)
docker build -t YOUR_DOCKERHUB_USER/factorytruth:latest .
docker push YOUR_DOCKERHUB_USER/factorytruth:latest

# On the server:
docker pull YOUR_DOCKERHUB_USER/factorytruth:latest
```

### 4. Create data directory and env file on the server

The app stores submissions, uploads, and JSON files in a `data/` directory. Use a **volume** so data survives restarts.

```bash
ssh root@YOUR_SERVER_IP

mkdir -p /opt/factorytruth/data
chmod 755 /opt/factorytruth/data
```

Create `/opt/factorytruth/.env.production` (or `.env`) with your real values:

```env
JWT_SECRET=your-long-random-secret-at-least-32-chars
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=your-secure-password
NEXT_PUBLIC_APP_URL=https://www.factorytruth.com
```

If you use DeepL or Google SSO, add:

```env
DEEPL_AUTH_KEY=your-deepl-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 5. Run the container

On the server:

```bash
docker run -d \
  --name factorytruth \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/factorytruth/data:/app/data \
  --env-file /opt/factorytruth/.env.production \
  factorytruth
```

(If you used Option 3b, use the image name you pushed, e.g. `YOUR_DOCKERHUB_USER/factorytruth:latest`.)

Check it’s running: `docker ps`. Then open `http://YOUR_SERVER_IP:3000` to test.

### 6. Put Nginx in front (HTTPS + domain)

Install Nginx and Certbot:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Point your **domain** (e.g. www.factorytruth.com) to this server: in **GoDaddy DNS**, add an **A** record for **www** (and optionally **@**) with the server’s **public IP**.

Then:

```bash
certbot --nginx -d www.factorytruth.com -d factorytruth.com
```

When asked, choose to redirect HTTP to HTTPS. Certbot will configure Nginx.

Add (or edit) the Nginx server block so traffic is proxied to the app:

```bash
# Example: create /etc/nginx/sites-available/factorytruth
nano /etc/nginx/sites-available/factorytruth
```

Paste (adjust server_name if needed):

```nginx
server {
    server_name www.factorytruth.com factorytruth.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
ln -sf /etc/nginx/sites-available/factorytruth /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

After DNS has propagated, https://www.factorytruth.com should open your app.

### 7. Updating the app later

```bash
cd /opt/factorytruth
# Pull latest code (if you use Git) or rsync again
docker build -t factorytruth .
docker stop factorytruth && docker rm factorytruth
docker run -d --name factorytruth --restart unless-stopped -p 3000:3000 -v /opt/factorytruth/data:/app/data --env-file /opt/factorytruth/.env.production factorytruth
```

---

## Option B: Mainland China (ICP required)

To host **inside mainland China** (e.g. Alibaba Cloud or Tencent Cloud in Beijing/Shanghai):

1. **ICP filing (备案)** is required for a domain used on servers in China. Your cloud provider (Alibaba/Tencent) has a 备案 process; it can take days or weeks and needs business/ID docs and a Chinese contact in some cases.
2. Use the **same** Docker steps as above, but:
   - Create the VM in a **mainland** region (e.g. Beijing, Shanghai).
   - Complete ICP for **factorytruth.com** (and www) before pointing the domain to the server.
3. After ICP is approved, set the domain’s **A** record to your Chinese server IP and then use Nginx + Certbot (or the provider’s SSL) as in Option A.

---

## Summary

| Step | Hong Kong | Mainland China |
|------|-----------|----------------|
| VM  | HK region, Ubuntu 22.04 | China region, Ubuntu 22.04 |
| ICP | Not needed | Required before go-live |
| Docker + volume | Same | Same |
| Domain DNS | A record → server IP | A record → server IP (after ICP) |
| Nginx + SSL | Certbot (Let’s Encrypt) | Certbot or provider SSL |

Data lives in `/opt/factorytruth/data` on the host (submissions, uploads, users, audit questions). Back it up regularly.
