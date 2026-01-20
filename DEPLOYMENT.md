# 🚀 Production Deployment Guide
## Smart Inventory & Billing System

This guide provides step-by-step instructions for deploying the Smart Inventory & Billing System to production.

---

## 📋 Table of Contents

1. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
2. [Backend Deployment (Render)](#2-backend-deployment-render)
3. [Frontend Deployment (Vercel)](#3-frontend-deployment-vercel)
4. [Environment Variables](#4-environment-variables)
5. [Post-Deployment Verification](#5-post-deployment-verification)
6. [Troubleshooting](#6-troubleshooting)

---

## 1️⃣ MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (or log in if you have one)
3. Choose the **Free (M0) Shared** cluster

### Step 2: Create a Cluster

1. Click **"Build a Database"**
2. Select **FREE** tier (M0 Sandbox)
3. Choose your preferred cloud provider and region (closest to your Render region)
4. Click **"Create"** (cluster name: `Cluster0` is fine)

**⏱️ Wait 3-5 minutes for cluster creation**

### Step 3: Configure Database Access

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username (e.g., `inventory_admin`)
5. Generate a secure password or create your own
   - **⚠️ IMPORTANT:** Note this password - you'll need it for the connection string
   - **⚠️ IMPORTANT:** If password contains special characters, URL-encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `$` → `%24`
     - `%` → `%25`
     - `&` → `%26`
     - etc.
6. Set user privileges to **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - For production, consider restricting to Render IPs
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Python"** and version **"3.6 or later"**
5. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Format Connection String

Replace placeholders in the connection string:

1. Replace `<username>` with your database username
2. Replace `<password>` with your URL-encoded password
3. Add database name at the end:
   ```
   mongodb+srv://inventory_admin:PASSWORD@cluster0.xxxxx.mongodb.net/inventory_db?retryWrites=true&w=majority
   ```

**Example:**
```
mongodb+srv://inventory_admin:MyP%40ssw0rd%21@cluster0.abc123.mongodb.net/inventory_db?retryWrites=true&w=majority
```

**📝 Save this connection string - you'll use it in Render environment variables**

---

## 2️⃣ Backend Deployment (Render)

### Step 1: Prepare Repository

1. Ensure your code is pushed to GitHub/GitLab/Bitbucket
2. Verify `backend/` directory contains:
   - `app.py` (production entry point)
   - `requirements.txt` (includes `gunicorn`)
   - `Procfile` (for Render)
   - `render.yaml` (optional, for declarative setup)

### Step 2: Create Render Account

1. Go to [Render](https://render.com/)
2. Sign up with GitHub/GitLab/Bitbucket (recommended) or email
3. Complete account setup

### Step 3: Create Web Service

#### Option A: Using Render Dashboard

1. Click **"New +"** → **"Web Service"**
2. Connect your repository
3. Select the repository containing your code
4. Configure service:
   - **Name:** `inventory-backend` (or your preferred name)
   - **Root Directory:** `backend` (IMPORTANT!)
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - **Plan:** Free (or paid plan for better performance)

#### Option B: Using render.yaml (Declarative)

1. Click **"New +"** → **"Blueprint"**
2. Connect your repository
3. Select the repository
4. Render will detect `render.yaml` in the `backend/` directory
5. Review and apply the configuration

### Step 4: Set Environment Variables

In the Render dashboard, go to your service → **Environment** tab:

Add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string from Step 1.6 |
| `MONGODB_DB_NAME` | `inventory_db` | Database name |
| `JWT_SECRET_KEY` | `[generate strong secret]` | Use: `openssl rand -hex 32` or online generator |
| `JWT_EXPIRATION_HOURS` | `24` | Token expiration time |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` | Frontend URL (update after Vercel deployment) |

**⚠️ Important:**
- `JWT_SECRET_KEY` should be a strong, random string (32+ characters)
- `MONGODB_URI` password must be URL-encoded if it contains special characters
- `CORS_ORIGINS` will be updated after frontend deployment

### Step 5: Deploy

1. Click **"Create Web Service"** or **"Apply"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Start your application
3. **⏱️ Wait 5-10 minutes for first deployment**

### Step 6: Get Backend URL

1. Once deployed, Render provides a URL:
   - Free tier: `https://inventory-backend.onrender.com`
   - Note: Free tier services sleep after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds (cold start)

**📝 Save this URL - you'll use it in Vercel environment variables**

### Step 7: Seed Owner Account

1. SSH into your Render instance or use Render Shell
2. Run:
   ```bash
   cd backend
   python seed_owner.py
   ```
3. Or use MongoDB Atlas interface to manually create owner user

**Owner Credentials:**
- Email: `owner@inventory.com`
- Password: (set in seed script)
- **⚠️ Change default password immediately after first login**

### Step 8: Test Backend

1. Health check: `https://your-backend.onrender.com/health`
   - Should return: `{"status": "healthy"}`
2. Test public QR endpoint: `https://your-backend.onrender.com/items/qr/TEST-TOKEN`
   - Should return 404 (expected for non-existent token)

---

## 3️⃣ Frontend Deployment (Vercel)

### Step 1: Prepare Repository

1. Ensure your code is pushed to GitHub/GitLab/Bitbucket
2. Verify `frontend/` directory contains:
   - `package.json`
   - `next.config.ts`
   - `vercel.json` (optional)

### Step 2: Create Vercel Account

1. Go to [Vercel](https://vercel.com/)
2. Sign up with GitHub/GitLab/Bitbucket (recommended)
3. Complete account setup

### Step 3: Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your repository
3. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend` (IMPORTANT!)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

### Step 4: Set Environment Variables

In project settings → **Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` |

**⚠️ Important:**
- Use `NEXT_PUBLIC_` prefix for client-side accessible variables
- Value should be your Render backend URL (no trailing slash)

### Step 5: Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Build Next.js application
   - Deploy to CDN
3. **⏱️ Deployment typically takes 2-5 minutes**

### Step 6: Get Frontend URL

1. Once deployed, Vercel provides a URL:
   - Format: `https://your-project.vercel.app`
   - Custom domains can be configured later

**📝 Save this URL**

### Step 7: Update Backend CORS

1. Go back to Render dashboard
2. Edit your backend service environment variables
3. Update `CORS_ORIGINS`:
   ```
   https://your-project.vercel.app
   ```
   (For multiple origins, comma-separate: `https://app1.vercel.app,https://app2.vercel.app`)

4. **Redeploy** backend service (Render auto-redeploys on env var changes)

### Step 8: Test Frontend

1. Visit your Vercel URL
2. Test features:
   - Public QR scanning (`/scan`)
   - Buyer registration (`/register`)
   - Buyer login (`/login`)
   - Cart and checkout (as buyer)
   - Inventory management (as owner)

---

## 4️⃣ Environment Variables Summary

### Backend (Render)

```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/inventory_db?retryWrites=true&w=majority
MONGODB_DB_NAME=inventory_db
JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 5️⃣ Post-Deployment Verification

### ✅ Backend Health Check

1. **Health Endpoint:**
   ```bash
   curl https://your-backend.onrender.com/health
   ```
   Expected: `{"status": "healthy"}`

2. **Public QR Endpoint (Rate Limited):**
   ```bash
   curl https://your-backend.onrender.com/items/qr/INV-TEST123
   ```
   Expected: `{"error": "Item not found"}` (404)

### ✅ Frontend Functionality

Test the following flows:

1. **Public QR Scanning:**
   - Visit `/scan`
   - Scan/upload a QR code
   - Verify product info displays

2. **Buyer Registration:**
   - Visit `/register`
   - Create buyer account
   - Verify redirect to dashboard

3. **Buyer Login:**
   - Visit `/login`
   - Login with buyer credentials
   - Verify access to cart

4. **Cart & Checkout:**
   - Add items to cart
   - Proceed to checkout
   - Verify order creation
   - Verify bill generation

5. **Owner Login:**
   - Login with owner credentials
   - Verify inventory CRUD access
   - Verify QR code generation

### ✅ Database Verification

1. **MongoDB Atlas Dashboard:**
   - Go to **Database** → **Browse Collections**
   - Verify collections exist:
     - `users`
     - `inventory`
     - `orders`
   - Verify owner user exists

### ✅ Security Checks

1. **CORS:**
   - Backend should only accept requests from frontend domain
   - Test from different origin (should fail)

2. **Authentication:**
   - Protected routes require valid JWT
   - Expired tokens are rejected

3. **Authorization:**
   - Buyers cannot access owner-only routes
   - Owners cannot make purchases

---

## 6️⃣ Troubleshooting

### Backend Issues

#### ❌ Build Fails: "Module not found"
- **Solution:** Ensure `requirements.txt` includes all dependencies
- Check `backend/requirements.txt` has `gunicorn==21.2.0`

#### ❌ Deployment Fails: "Port already in use"
- **Solution:** Render uses `$PORT` environment variable
- Verify Procfile uses `$PORT` not hardcoded port

#### ❌ MongoDB Connection Error
- **Solution:** 
  1. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
  2. Check connection string format
  3. Ensure password is URL-encoded if it contains special characters
  4. Verify database user has read/write permissions

#### ❌ Service Keeps Restarting
- **Solution:**
  1. Check Render logs for errors
  2. Verify all environment variables are set
  3. Check `app.py` exists and exports `app` variable

#### ❌ CORS Errors in Browser
- **Solution:**
  1. Verify `CORS_ORIGINS` includes frontend URL
  2. Ensure no trailing slashes
  3. Redeploy backend after changing CORS settings

### Frontend Issues

#### ❌ Build Fails: "API URL not found"
- **Solution:** Ensure `NEXT_PUBLIC_API_URL` is set in Vercel environment variables

#### ❌ API Calls Fail: "Network Error"
- **Solution:**
  1. Verify `NEXT_PUBLIC_API_URL` points to correct backend URL
  2. Check backend is running (free tier may be sleeping)
  3. Verify CORS is configured correctly

#### ❌ Images/Assets Not Loading
- **Solution:** Verify `next.config.ts` has correct asset configuration

### MongoDB Issues

#### ❌ Connection Timeout
- **Solution:**
  1. Check MongoDB Atlas cluster is running
  2. Verify IP whitelist configuration
  3. Check connection string format

#### ❌ Authentication Failed
- **Solution:**
  1. Verify username/password in connection string
  2. Ensure password is URL-encoded
  3. Check database user permissions

---

## 📊 Production URLs Example

After deployment, you'll have:

- **Frontend:** `https://inventory-system.vercel.app`
- **Backend:** `https://inventory-backend.onrender.com`
- **Database:** `mongodb+srv://user:pass@cluster.mongodb.net/inventory_db`

---

## 🔐 Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use strong, random JWT secret (32+ characters)
   - Rotate secrets periodically

2. **MongoDB:**
   - Use strong database passwords
   - Restrict IP whitelist to known IPs (for production)
   - Enable MongoDB Atlas encryption at rest

3. **HTTPS:**
   - Vercel and Render provide HTTPS by default
   - Always use HTTPS in production

4. **CORS:**
   - Restrict CORS origins to your frontend domains only
   - Never use `*` in production

5. **Rate Limiting:**
   - Public endpoints are rate-limited (30 req/min)
   - Monitor for abuse

---

## 📝 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write access
- [ ] Network access configured (IP whitelist)
- [ ] Connection string formatted correctly
- [ ] Backend deployed to Render
- [ ] Backend environment variables configured
- [ ] Backend health check passes
- [ ] Owner account seeded
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables configured
- [ ] Backend CORS updated with frontend URL
- [ ] Public QR scanning works
- [ ] Buyer registration/login works
- [ ] Cart and checkout flow works
- [ ] Owner inventory management works
- [ ] All functionality tested end-to-end

---

## 🎉 Deployment Complete!

Your Smart Inventory & Billing System is now live in production!

**Next Steps:**
- Monitor application logs in Render and Vercel
- Set up custom domain (optional)
- Configure MongoDB Atlas backups
- Set up monitoring/alerting (optional)
- Consider upgrading to paid plans for better performance

---

**Support:**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
