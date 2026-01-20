# 🚀 Production Deployment Guide
## Smart Inventory & Billing System

Complete step-by-step guide to deploy Next.js + Flask + MongoDB Atlas to production.

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                          │
│                    https://your-app.vercel.app                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend Hosting)                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Next.js App Router                       │ │
│  │  • SSR/SSG pages        • QR Scanner (Camera/Upload)       │ │
│  │  • Static assets        • Cart & Checkout UI               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Environment: NEXT_PUBLIC_API_URL                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                        HTTPS API Calls
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDER (Backend Hosting)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Flask REST API                          │ │
│  │  • JWT Authentication   • Inventory CRUD                   │ │
│  │  • Order Management     • QR Code Generation               │ │
│  │  • Role-based Access    • Stock Validation                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Server: Gunicorn (production WSGI)                             │
│  Environment: MONGODB_URI, JWT_SECRET_KEY, CORS_ORIGINS         │
└─────────────────────────────────────────────────────────────────┘
                                │
                        mongodb+srv://
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MONGODB ATLAS (Database)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Collections:                                               │ │
│  │  • users (Owner + Buyers)                                  │ │
│  │  • inventory (Products with QR codes)                      │ │
│  │  • orders (Purchases with status tracking)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│  • IP Whitelist: 0.0.0.0/0 (for Render dynamic IPs)            │
│  • Encryption at rest and in transit                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Pre-Deployment Checklist

- [ ] GitHub repository with both `frontend/` and `backend/` folders
- [ ] MongoDB Atlas account created
- [ ] Vercel account (free tier works)
- [ ] Render account (free tier works)
- [ ] SSL/HTTPS enabled (automatic with Vercel & Render)

---

## 1️⃣ MongoDB Atlas Setup

### Step 1.1: Create Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up or log in
3. Click **"Build a Database"**
4. Select **FREE (M0)** tier
5. Choose cloud provider: **AWS** (recommended)
6. Select region closest to your users
7. Name cluster: `inventory-cluster`
8. Click **"Create Cluster"** (takes 1-3 minutes)

### Step 1.2: Create Database User

1. Go to **Database Access** → **Add New Database User**
2. Authentication: **Password**
3. Username: `inventory_admin`
4. Password: Generate a strong password (save it!)
5. Privileges: **Read and write to any database**
6. Click **"Add User"**

> ⚠️ **IMPORTANT**: If password contains special characters (`@`, `#`, `$`, etc.), URL-encode them:
> - `@` → `%40`
> - `#` → `%23`
> - `$` → `%24`

### Step 1.3: Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
3. Click **"Confirm"**

> This is required because Render uses dynamic IP addresses.

### Step 1.4: Get Connection String

1. Go to **Database** → Click **"Connect"**
2. Select **"Connect your application"**
3. Driver: **Python** / Version: **3.6 or later**
4. Copy the connection string:

```
mongodb+srv://inventory_admin:<password>@inventory-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Replace `<password>` with your actual password (URL-encoded if needed)

---

## 2️⃣ Backend Deployment (Render)

### Step 2.1: Prepare Backend for Production

Ensure these files exist in your `backend/` folder:

**`requirements.txt`** (already exists):
```
Flask==3.0.0
Flask-CORS==4.0.0
PyMongo==4.6.1
python-dotenv==1.0.0
PyJWT==2.8.0
bcrypt==4.1.2
qrcode[pil]==7.4.2
email-validator==2.2.0
gunicorn==21.2.0
```

**`Procfile`** (already exists):
```
web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

### Step 2.2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub** repository
4. Select your repository

Configure the service:
| Setting | Value |
|---------|-------|
| **Name** | `inventory-api` |
| **Region** | Choose closest to users |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |

### Step 2.3: Add Environment Variables

Click **"Environment"** → Add these variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://inventory_admin:YOUR_PASSWORD@inventory-cluster.xxxxx.mongodb.net/inventory_db?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | `inventory_db` |
| `JWT_SECRET_KEY` | `your-super-secret-key-generate-with-openssl` |
| `JWT_EXPIRATION_HOURS` | `24` |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` (update after Vercel deploy) |
| `FLASK_ENV` | `production` |

> 💡 **Generate JWT Secret**: Run `openssl rand -hex 32` in terminal

### Step 2.4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes on free tier)
3. Note your backend URL: `https://inventory-api.onrender.com`

### Step 2.5: Verify Backend Health

```bash
curl https://inventory-api.onrender.com/health
# Expected: {"status": "healthy"}
```

---

## 3️⃣ Frontend Deployment (Vercel)

### Step 3.1: Prepare Frontend

Ensure `frontend/vercel.json` exists:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  }
}
```

### Step 3.2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your **GitHub** repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework** | Next.js (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |

### Step 3.3: Add Environment Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://inventory-api.onrender.com` |

### Step 3.4: Deploy

1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. Note your frontend URL: `https://your-project.vercel.app`

---

## 4️⃣ Post-Deployment Configuration

### Step 4.1: Update Backend CORS

Go back to Render and update the `CORS_ORIGINS` environment variable:

```
CORS_ORIGINS=https://your-project.vercel.app
```

Then **Manual Deploy** → **Deploy latest commit**

### Step 4.2: Seed Owner Account

Run this one-time script to create the owner account:

```bash
# SSH into Render or run locally with production MONGODB_URI
python seed_owner.py
```

Or create owner manually via MongoDB Atlas:
1. Go to **Browse Collections** → `users`
2. Insert document:
```json
{
  "name": "Store Owner",
  "email": "owner@store.com",
  "password": "<bcrypt-hashed-password>",
  "role": "owner",
  "createdAt": { "$date": "2026-01-20T00:00:00Z" }
}
```

---

## 5️⃣ Production Validation Checklist

| Test | How to Verify |
|------|---------------|
| ✅ Health Check | `curl https://your-api.onrender.com/health` |
| ✅ Public QR | `curl https://your-api.onrender.com/items/qr/TEST` → `{"error": "Item not found"}` |
| ✅ Buyer Registration | Register new buyer on frontend |
| ✅ Login | Login with buyer credentials |
| ✅ Owner Login | Login with owner credentials |
| ✅ Inventory Load | View products on dashboard |
| ✅ QR Camera Scan | Open `/scan`, use camera |
| ✅ QR Image Upload | Upload QR image |
| ✅ Add to Cart | Add product with quantity |
| ✅ Checkout | Complete purchase |
| ✅ Stock Update | Verify quantity decreased |
| ✅ Order History | View orders page |
| ✅ Owner Sales | Owner can see all orders |

---

## 6️⃣ Environment Variables Summary

### Backend (Render)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/inventory_db
MONGODB_DB_NAME=inventory_db
JWT_SECRET_KEY=your-64-char-hex-secret
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=https://your-app.vercel.app
FLASK_ENV=production
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

---

## 7️⃣ Common Errors & Fixes

### ❌ MongoDB Connection Failed
**Error**: `ServerSelectionTimeoutError`

**Fix**:
1. Check IP whitelist includes `0.0.0.0/0`
2. Verify password is URL-encoded
3. Check connection string format

### ❌ CORS Error
**Error**: `Access-Control-Allow-Origin` error

**Fix**:
1. Update `CORS_ORIGINS` in Render
2. Include full URL with `https://`
3. Redeploy backend

### ❌ 404 on API Routes
**Error**: API endpoints return 404

**Fix**:
1. Verify `NEXT_PUBLIC_API_URL` has no trailing slash
2. Check backend is running (Render dashboard)
3. Backend free tier sleeps after 15 min inactivity

### ❌ JWT Expired
**Error**: `Token has expired`

**Fix**:
1. Increase `JWT_EXPIRATION_HOURS`
2. Frontend should redirect to login on 401

### ❌ QR Camera Not Working
**Error**: Camera permission denied

**Fix**:
1. Must use HTTPS (automatic with Vercel)
2. User must grant camera permission
3. Check browser compatibility

### ❌ Render Free Tier Sleep
**Issue**: First request takes 30+ seconds

**Fix**:
1. Normal on free tier (cold start)
2. Upgrade to paid tier for always-on
3. Use cron ping service to keep awake

---

## 8️⃣ Production Best Practices

### Security
- ✅ Use strong JWT secret (64+ characters)
- ✅ Never commit `.env` files
- ✅ Use HTTPS only
- ✅ Enable rate limiting
- ✅ Disable debug mode in production

### Performance
- ✅ Enable MongoDB connection pooling
- ✅ Use Gunicorn with multiple workers
- ✅ Enable Next.js caching
- ✅ Optimize images

### Monitoring
- ✅ Check Render logs for errors
- ✅ Monitor MongoDB Atlas metrics
- ✅ Set up Vercel analytics

---

## 9️⃣ Quick Commands Reference

### Generate JWT Secret
```bash
openssl rand -hex 32
```

### Test Backend Health
```bash
curl https://your-api.onrender.com/health
```

### Trigger Redeploy (Render)
```bash
# Push to GitHub triggers auto-deploy
git push origin main
```

### View Logs (Render)
1. Go to Render Dashboard
2. Click your service
3. Click "Logs" tab

---

## 📱 QR Scanner HTTPS Requirement

The QR scanner uses the browser's Camera API which **requires HTTPS**.

✅ **Vercel** automatically provides HTTPS
✅ **Render** automatically provides HTTPS

Camera scanner will NOT work on:
- `http://localhost` (except for development)
- Any `http://` URL in production

---

## 🎉 Deployment Complete!

Your production URLs:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://inventory-api.onrender.com`
- **Database**: MongoDB Atlas Cloud

Users can now:
1. Scan QR codes (public, no login)
2. Register as buyers
3. Login and shop
4. Complete purchases with cart/checkout
5. View order history
