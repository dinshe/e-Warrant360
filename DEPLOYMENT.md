# e-Warrant360 — Complete A–Z Production Deployment Guide

> **Target:** Ubuntu 22.04 LTS on AWS EC2 Free Tier (t2.micro / t3.micro)  
> **Stack:** Next.js 15 · PostgreSQL 16 · Docker Compose · Nginx · Let's Encrypt SSL  
> **Estimated time:** 45–90 minutes for a fresh deployment

---

## Table of Contents

1. [Pre-Requisites](#1-pre-requisites)
2. [AWS Account & EC2 Launch](#2-aws-account--ec2-launch)
3. [Security Group Configuration](#3-security-group-configuration)
4. [Connect to EC2 via SSH](#4-connect-to-ec2-via-ssh)
5. [Server Preparation (Ubuntu 22.04)](#5-server-preparation-ubuntu-2204)
6. [Install Docker & Docker Compose](#6-install-docker--docker-compose)
7. [Clone the Repository](#7-clone-the-repository)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Launch the Application](#9-launch-the-application)
10. [Install & Configure Nginx Reverse Proxy](#10-install--configure-nginx-reverse-proxy)
11. [Free SSL with Let's Encrypt (Certbot)](#11-free-ssl-with-lets-encrypt-certbot)
12. [Seed the Database (First Run)](#12-seed-the-database-first-run)
13. [Auto-Start on Server Reboot](#13-auto-start-on-server-reboot)
14. [Domain Name Setup (Free Options)](#14-domain-name-setup-free-options)
15. [Onboarding New Shops](#15-onboarding-new-shops)
16. [Operations & Maintenance](#16-operations--maintenance)
17. [Monitoring & Logs](#17-monitoring--logs)
18. [Backup & Recovery](#18-backup--recovery)
19. [Free Tier Limits & Scaling Path](#19-free-tier-limits--scaling-path)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Pre-Requisites

Before you start, have the following ready:

| Item | Where to get it |
|------|----------------|
| AWS account (free tier) | [aws.amazon.com/free](https://aws.amazon.com/free) |
| A domain name (optional but recommended) | Freenom (.tk/.ml) or Namecheap (~\$10/yr) |
| GitHub repo access | [github.com/dinshe/e-Warrant360](https://github.com/dinshe/e-Warrant360) |
| SSH key pair (RSA or ED25519) | Generated during EC2 launch |
| `NEXTAUTH_SECRET` (32-byte random string) | Generated in Step 8 |

---

## 2. AWS Account & EC2 Launch

### 2.1 Sign in to AWS Console

Go to [console.aws.amazon.com](https://console.aws.amazon.com) → **EC2** → **Launch Instance**.

### 2.2 Instance Configuration

| Setting | Value |
|---------|-------|
| **Name** | `e-warrant360-prod` |
| **AMI** | Ubuntu Server 22.04 LTS (64-bit x86) |
| **Instance type** | `t2.micro` (free tier) or `t3.micro` |
| **Key pair** | Create new → `e-warrant360-key` → download `.pem` |
| **Storage** | 20 GB gp2 (free tier gives 30 GB total) |
| **Network** | Default VPC, enable Auto-assign public IP |

### 2.3 Create & Download Key Pair

1. Select **Create new key pair**
2. Name: `e-warrant360-key`
3. Type: **RSA**, format: **.pem**
4. Download and save it securely — you **cannot** re-download it.

```bash
# On your local machine (Windows PowerShell):
Move-Item ~/Downloads/e-warrant360-key.pem ~/.ssh/
# Restrict permissions (important on Linux/Mac — skip on Windows)
chmod 400 ~/.ssh/e-warrant360-key.pem
```

### 2.4 Launch the Instance

Click **Launch Instance**. Wait 1–2 minutes for the instance to reach `Running` state.

Note your instance's **Public IPv4 address** (e.g., `13.234.56.78`).

---

## 3. Security Group Configuration

Go to **EC2 → Security Groups** → find the group attached to your instance → **Edit Inbound Rules**.

Add these rules:

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| SSH | TCP | 22 | My IP | Your admin access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic + SSL cert verification |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom TCP | TCP | 3000 | My IP | Direct Next.js access (dev only, remove in prod) |

> **Security tip:** Remove port 3000 from the security group once Nginx is configured. Never expose the Node.js port directly in production.

---

## 4. Connect to EC2 via SSH

### Windows (PowerShell)

```powershell
ssh -i ~/.ssh/e-warrant360-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Windows (PuTTY)

1. Convert `.pem` to `.ppk` using PuTTYgen
2. Open PuTTY → Host: `ubuntu@YOUR_EC2_PUBLIC_IP` → SSH Auth → Browse to `.ppk`

### Linux / macOS

```bash
ssh -i ~/.ssh/e-warrant360-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

You should see the Ubuntu welcome banner. You're now on the server.

---

## 5. Server Preparation (Ubuntu 22.04)

Run these commands on the EC2 instance:

```bash
# Update package lists and upgrade existing packages
sudo apt-get update && sudo apt-get upgrade -y

# Install required tools
sudo apt-get install -y \
  git \
  curl \
  wget \
  unzip \
  ca-certificates \
  gnupg \
  lsb-release \
  ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status

# Set the server timezone to Sri Lanka
sudo timedatectl set-timezone Asia/Colombo
timedatectl status
```

---

## 6. Install Docker & Docker Compose

```bash
# Remove any old Docker installations
sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group (avoids sudo for docker commands)
sudo usermod -aG docker ubuntu

# Apply group change without logging out (one-time)
newgrp docker

# Verify installation
docker --version
docker compose version
```

> **Important:** The `newgrp docker` command applies the group immediately in your current session. On next login, `docker` commands will work without `sudo` automatically.

---

## 7. Clone the Repository

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/dinshe/e-Warrant360.git e-warrant360

# Enter the project directory
cd e-warrant360

# Verify files are present
ls -la
```

---

## 8. Configure Environment Variables

This is the most critical step. The app reads all config from a `.env` file.

```bash
# Create the production environment file
nano .env
```

Paste the following, filling in your own values:

```env
# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://ewarrant:CHANGE_THIS_STRONG_PASSWORD@postgres:5432/ewarrant360?schema=public"

# ─────────────────────────────────────────────────────────────
# AUTH (NextAuth v5)
# ─────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="PASTE_YOUR_32_BYTE_RANDOM_SECRET_HERE"

# Set to your actual domain or EC2 IP
# Examples:
#   NEXTAUTH_URL="https://warranty.yourshop.lk"
#   NEXTAUTH_URL="http://13.234.56.78"
NEXTAUTH_URL="https://YOUR_DOMAIN_OR_IP"

# Used for QR codes and verify links on certificates
NEXT_PUBLIC_APP_URL="https://YOUR_DOMAIN_OR_IP"

# ─────────────────────────────────────────────────────────────
# POSTGRES (Docker service credentials)
# ─────────────────────────────────────────────────────────────
POSTGRES_DB=ewarrant360
POSTGRES_USER=ewarrant
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD

# ─────────────────────────────────────────────────────────────
# PLATFORM ADMIN (first superuser)
# ─────────────────────────────────────────────────────────────
# Used by prisma/seed.ts to create the platform admin account
ADMIN_EMAIL="admin@yourcompany.lk"
ADMIN_PASSWORD="ChangeMe@Admin123"
ADMIN_NAME="Platform Admin"

# ─────────────────────────────────────────────────────────────
# EMAIL (optional - for password reset emails)
# ─────────────────────────────────────────────────────────────
# Leave empty to disable email; reset links will be logged to console
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT=587
# SMTP_USER="your@gmail.com"
# SMTP_PASS="your_app_password"
# SMTP_FROM="e-Warrant360 <noreply@yourdomain.lk>"

# ─────────────────────────────────────────────────────────────
# NODE ENVIRONMENT
# ─────────────────────────────────────────────────────────────
NODE_ENV=production
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`.

### Generate NEXTAUTH_SECRET

```bash
# Run this and copy the output into your .env file
openssl rand -base64 32
```

### Verify the .env file

```bash
# Check it looks right (passwords are hidden for display)
cat .env | grep -v PASSWORD | grep -v SECRET
```

---

## 9. Launch the Application

```bash
# Make sure you're in the project directory
cd ~/e-warrant360

# Build the Docker image and start all services
# This takes 3–5 minutes on first run (downloads Node.js, builds Next.js)
docker compose up --build -d

# Watch the startup logs (Ctrl+C to stop watching, containers keep running)
docker compose logs -f
```

The startup process automatically:
1. Pulls PostgreSQL 16 image
2. Builds the Next.js app (multi-stage Docker build)
3. Runs `prisma db push` to create all database tables
4. Starts the Next.js server on port 3000

### Verify services are running

```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS          PORTS
e-warrant360-app-1      Up              0.0.0.0:3000->3000/tcp
e-warrant360-postgres-1 Up              5432/tcp
```

### Test the app is running

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Should return: 200
```

---

## 10. Install & Configure Nginx Reverse Proxy

Nginx sits in front of Next.js, handles SSL, compression, and rate limiting.

```bash
# Install Nginx
sudo apt-get install -y nginx

# Remove default config
sudo rm -f /etc/nginx/sites-enabled/default

# Create e-warrant360 site config
sudo nano /etc/nginx/sites-available/e-warrant360
```

Paste this configuration (replace `YOUR_DOMAIN_OR_IP` with your actual domain or IP):

```nginx
upstream nextjs_app {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Redirect HTTP to HTTPS (uncomment after SSL is set up)
# server {
#     listen 80;
#     server_name YOUR_DOMAIN;
#     return 301 https://$host$request_uri;
# }

server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max upload size (for future file attachments)
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Static files caching (Next.js /_next/static/)
    location /_next/static/ {
        proxy_pass http://nextjs_app;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public assets
    location /public/ {
        proxy_pass http://nextjs_app;
        proxy_cache_valid 200 7d;
    }

    # API rate limiting
    location /api/verify/ {
        limit_req zone=verify_limit burst=10 nodelay;
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # All other requests → Next.js
    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
```

Add rate limiting zone to the main nginx.conf:

```bash
sudo nano /etc/nginx/nginx.conf
```

Inside the `http { }` block, add this line:

```nginx
limit_req_zone $binary_remote_addr zone=verify_limit:10m rate=30r/m;
```

Enable the site and test:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/e-warrant360 /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# If test passes, reload
sudo systemctl enable nginx
sudo systemctl reload nginx
```

Now open your browser and visit `http://YOUR_EC2_PUBLIC_IP` — you should see the e-Warrant360 home page.

---

## 11. Free SSL with Let's Encrypt (Certbot)

> **Requires a domain name.** If you only have an IP, skip this section and use HTTP only (not recommended for production with real customer data).

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com \
  --non-interactive --agree-tos --email your@email.com
```

Certbot automatically:
- Obtains the certificate from Let's Encrypt
- Edits your Nginx config to add SSL
- Sets up HTTP → HTTPS redirect
- Schedules auto-renewal via systemd timer

### Verify auto-renewal

```bash
sudo certbot renew --dry-run
# Should complete without errors
```

### Update your .env after adding SSL

```bash
nano ~/e-warrant360/.env
# Update:
# NEXTAUTH_URL="https://your-domain.com"
# NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

Then restart the app:

```bash
cd ~/e-warrant360
docker compose down && docker compose up -d
```

---

## 12. Seed the Database (First Run)

The seed creates:
- A Platform Admin account
- A demo shop: **Colombo Tech Solutions**
- Demo products, customers, and warranty records
- Demo API key for POS integration testing

```bash
cd ~/e-warrant360

# Run database seed
docker compose exec app npx prisma db seed
```

You should see output like:
```
🌱 Seeding e-Warrant360 database...
✅ Platform admin created: admin@yourcompany.lk
✅ Demo shop created: Colombo Tech Solutions
✅ Created 2 products, 3 customers, 5 warranties
✅ Demo API key: ew_live_colombotech_demo_key_2024
🎉 Seed complete.
```

> **Important:** After seeding, immediately log in and change the admin password and demo shop passwords. The seed is for initial setup only.

---

## 13. Auto-Start on Server Reboot

The `docker-compose.yml` already has `restart: always` on both services, so Docker will automatically restart containers if the server reboots — **as long as Docker itself starts on boot**.

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Verify
sudo systemctl is-enabled docker
# Output: enabled
```

Test by rebooting:

```bash
sudo reboot
```

Wait 2–3 minutes, then SSH back in and verify:

```bash
cd ~/e-warrant360
docker compose ps
# Both containers should show "Up X minutes"
```

---

## 14. Domain Name Setup (Free Options)

### Option A: Free .tk / .ml Domain (Freenom)

1. Go to [freenom.com](https://www.freenom.com)
2. Search for `yourshopname.tk` or `.ml`
3. Register free (valid 12 months, renewable)
4. In **DNS Management**, add an **A record**:
   - Name: `@`  → Value: `YOUR_EC2_PUBLIC_IP`
   - Name: `www` → Value: `YOUR_EC2_PUBLIC_IP`
5. DNS propagates in 15–60 minutes

### Option B: No-IP Free Dynamic DNS

1. Sign up at [noip.com](https://www.noip.com/free)
2. Create a free hostname: `yourshop.ddns.net`
3. Point it to your EC2 IP
4. Install the DUC client on the server to keep it updated

### Option C: Paid Domain (~\$10/yr — Recommended)

Namecheap or GoDaddy for `.lk` domains (Sri Lanka) or `.com`. More professional for real business use.

---

## 15. Onboarding New Shops

e-Warrant360 is **multi-tenant by design**. Adding a new shop requires **zero code changes**.

### Option A: Self-Registration (Default Flow)

1. Shop owner visits `https://your-domain.com/register`
2. Creates their account (name, email, password)
3. Sets up their shop (name, address, phone, district)
4. Immediately gets their own isolated dashboard

The registration flow automatically:
- Creates a `User` record with hashed password
- Creates a `Shop` record with a unique `slug`
- Creates a `ShopUser` link with role `OWNER`
- Isolates all their data at the API layer via `shopId`

### Option B: Admin Creates Shop (Platform Admin Panel)

1. Log in as platform admin at `https://your-domain.com/admin`
2. Navigate to **Shops** → **Create New Shop**
3. Fill in shop details and create an owner account

### Option C: API (Automated Onboarding)

For integrators wanting to programmatically onboard shops:

```bash
# Register a new shop via API
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Owner Name",
    "email": "owner@newshop.lk",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "shopName": "New Electronics Shop",
    "shopCity": "Galle",
    "shopDistrict": "GALLE",
    "shopPhone": "0912345678"
  }'
```

### POS Integration for New Shop

Once a shop is onboarded, they can generate API keys from:  
**Settings → POS & External Integration → Generate API Key**

They then use the key to post sales from their POS:

```bash
curl -X POST https://your-domain.com/api/integrations/pos/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "ew_live_THEIR_KEY_HERE",
    "shopSlug": "their-shop-slug",
    "sale": {
      "customerName": "Ruwan Perera",
      "customerPhone": "0771234567",
      "productName": "Samsung Washing Machine",
      "productSku": "WM-SAM-7KG",
      "serialNumber": "SM2024XYZ001",
      "invoiceNumber": "INV-2024-001",
      "purchasePrice": 125000,
      "purchaseDate": "2024-01-15",
      "warrantyMonths": 24
    }
  }'
```

---

## 16. Operations & Maintenance

### View running containers

```bash
docker compose ps
```

### View application logs (live)

```bash
cd ~/e-warrant360
docker compose logs -f app
```

### View database logs

```bash
docker compose logs -f postgres
```

### Restart the app (after config changes)

```bash
docker compose restart app
```

### Full restart (both services)

```bash
docker compose down && docker compose up -d
```

### Deploy new version (code update)

```bash
cd ~/e-warrant360

# Pull latest code
git pull origin main

# Rebuild and restart (zero-downtime on t2.micro: ~2 min)
docker compose up --build -d

# Verify new containers are running
docker compose ps
```

### Connect to the database directly

```bash
docker compose exec postgres psql -U ewarrant -d ewarrant360
```

### Run Prisma migrations manually

```bash
docker compose exec app npx prisma db push
# or
docker compose exec app npx prisma migrate deploy
```

---

## 17. Monitoring & Logs

### Application logs location

```bash
# Live log stream
docker compose logs -f app --tail=100

# Save last 1000 lines to file
docker compose logs app --tail=1000 > /tmp/app-logs-$(date +%Y%m%d).txt
```

### Nginx access logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Server resource usage

```bash
# CPU, RAM, Disk
htop    # press q to quit
df -h   # disk space
free -h # RAM usage

# Docker container resource usage
docker stats
```

### Set up a simple uptime check (free)

Use [UptimeRobot](https://uptimerobot.com) (free tier, 50 monitors):
1. Sign up at uptimerobot.com
2. Add monitor: HTTP(S), URL: `https://your-domain.com/api/health` (or just `/`)
3. Set interval: 5 minutes
4. Add email/SMS alert on downtime

---

## 18. Backup & Recovery

### Automated daily database backup

```bash
# Create backup directory
mkdir -p ~/backups

# Create backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/ewarrant360_$DATE.sql.gz"

# Dump database and compress
docker compose -f ~/e-warrant360/docker-compose.yml exec -T postgres \
  pg_dump -U ewarrant ewarrant360 | gzip > "$FILE"

echo "Backup saved: $FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
echo "Old backups pruned."
EOF

chmod +x ~/backup-db.sh

# Test it
~/backup-db.sh

# Schedule daily at 2:00 AM Sri Lanka time (UTC+5:30 → 20:30 UTC previous day)
(crontab -l 2>/dev/null; echo "30 20 * * * /home/ubuntu/backup-db.sh >> /home/ubuntu/backup.log 2>&1") | crontab -
```

### Restore from backup

```bash
# Restore from a backup file
gunzip -c ~/backups/ewarrant360_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T postgres psql -U ewarrant -d ewarrant360
```

### Offload backups to S3 (optional, free tier 5GB)

```bash
# Install AWS CLI
sudo apt-get install -y awscli

# Configure with your IAM credentials
aws configure

# Add to backup script
aws s3 cp "$FILE" s3://your-backup-bucket/ewarrant360/
```

---

## 19. Free Tier Limits & Scaling Path

### AWS Free Tier (12 months)

| Resource | Free Tier | e-Warrant360 Usage |
|----------|-----------|-------------------|
| EC2 t2.micro | 750 hrs/mo | ~1 instance continuous |
| EBS Storage | 30 GB | ~20 GB configured |
| Data Transfer Out | 15 GB/mo | Depends on usage |
| Elastic IP | 1 free (if used) | 1 IP |

### What 1 t2.micro can handle

- **10–20 shops** with moderate daily use
- **~50–100 concurrent users** (Next.js + Prisma pool)
- **Up to 10,000 warranty records** without performance issues

### When to upgrade

| Signal | Action |
|--------|--------|
| RAM > 80% consistently | Upgrade to t3.small (~\$15/mo) |
| CPU > 70% sustained | Upgrade to t3.medium (~\$30/mo) |
| DB growing fast | Add RDS (PostgreSQL managed, ~\$15/mo) |
| Multiple regions needed | Use CloudFront CDN + multi-region RDS |

### Scaling path (no code changes needed)

```
t2.micro (free) → t3.small → t3.medium → c5.large → ECS/EKS cluster
SQLite/Postgres local → RDS PostgreSQL → Aurora Serverless
No CDN → CloudFront → Global CDN
```

---

## 20. Troubleshooting

### App container won't start

```bash
docker compose logs app --tail=50
```

Common causes:
- **DATABASE_URL wrong**: Check `POSTGRES_PASSWORD` matches in both `DATABASE_URL` and `POSTGRES_PASSWORD`
- **NEXTAUTH_SECRET missing**: Must be set in `.env`
- **Port 3000 in use**: `sudo lsof -i :3000`

### "Cannot connect to database"

```bash
# Check if postgres container is running
docker compose ps postgres

# Check if postgres is accepting connections
docker compose exec postgres pg_isready -U ewarrant -d ewarrant360
```

### Nginx 502 Bad Gateway

```bash
# Check app is actually listening on port 3000
curl http://localhost:3000

# Check nginx error log
sudo tail -20 /var/log/nginx/error.log

# Restart app
docker compose restart app
```

### "Invalid secret" / Auth not working

```bash
# Verify NEXTAUTH_SECRET is set
grep NEXTAUTH_SECRET ~/e-warrant360/.env

# Verify NEXTAUTH_URL matches your actual URL
grep NEXTAUTH_URL ~/e-warrant360/.env

# Restart to pick up env changes
docker compose restart app
```

### SSL certificate expired / not renewing

```bash
# Check renewal status
sudo certbot certificates

# Force renew
sudo certbot renew --force-renewal

# Reload nginx
sudo systemctl reload nginx
```

### Out of disk space

```bash
# Check space
df -h

# Clean Docker build cache
docker system prune -af

# Clean old logs
sudo journalctl --vacuum-time=7d
```

### Database full / slow queries

```bash
# Connect to database
docker compose exec postgres psql -U ewarrant -d ewarrant360

# Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Vacuum (reclaim space)
VACUUM ANALYZE;
\q
```

---

## Quick Reference Card

```bash
# ── Start everything ──────────────────────────────────
cd ~/e-warrant360 && docker compose up -d

# ── Stop everything ───────────────────────────────────
docker compose down

# ── Deploy new code ───────────────────────────────────
git pull && docker compose up --build -d

# ── View app logs ─────────────────────────────────────
docker compose logs -f app

# ── Database shell ────────────────────────────────────
docker compose exec postgres psql -U ewarrant -d ewarrant360

# ── App shell (run prisma commands) ───────────────────
docker compose exec app sh

# ── Manual backup ─────────────────────────────────────
~/backup-db.sh

# ── Nginx reload (after config change) ───────────────
sudo nginx -t && sudo systemctl reload nginx

# ── Check SSL cert ────────────────────────────────────
sudo certbot certificates
```

---

*Last updated: September 2026 | e-Warrant360 v1.0 | Built for Sri Lanka SMBs*
