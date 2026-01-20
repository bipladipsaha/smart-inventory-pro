# 🚀 Smart Inventory & Billing System - Production Deployment

This repository contains a **production-ready** Smart Inventory & Billing System with complete deployment configurations and documentation.

---

## 📦 What's Included

### ✅ Complete Application
- **Backend:** Flask REST API with JWT authentication
- **Frontend:** Next.js with App Router (TypeScript)
- **Database:** MongoDB Atlas integration
- **Features:**
  - QR code scanning & upload
  - Cart & checkout system
  - Order management & billing
  - Role-based access control (Owner/Buyer)
  - Inventory CRUD operations
  - Public QR lookup (no login required)

### ✅ Production Deployment Files

**Backend:**
- `backend/app.py` - Production entry point for Gunicorn
- `backend/Procfile` - Render deployment configuration
- `backend/render.yaml` - Declarative Render setup
- `backend/requirements.txt` - Includes Gunicorn for production

**Frontend:**
- `frontend/vercel.json` - Vercel deployment configuration

**Documentation:**
- `DEPLOYMENT.md` - Complete step-by-step deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Verification checklist
- `QUICK_START.md` - Quick reference guide

---

## 🏗️ Architecture

```
User (Browser)
   ↓
Vercel (Next.js Frontend)
   ↓ HTTPS
Render (Flask Backend + Gunicorn)
   ↓ HTTPS
MongoDB Atlas (Cloud Database)
```

### Technology Stack

**Frontend:**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components

**Backend:**
- Flask 3.0
- Gunicorn (production server)
- PyMongo (MongoDB driver)
- JWT authentication
- bcrypt password hashing

**Database:**
- MongoDB Atlas (cloud-hosted)

**Hosting:**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

---

## 🚀 Quick Deployment

### 1. MongoDB Atlas (5 minutes)
1. Create free cluster
2. Create database user
3. Configure network access
4. Get connection string

### 2. Render Backend (10 minutes)
1. Connect repository
2. Set root directory: `backend`
3. Configure environment variables
4. Deploy

### 3. Vercel Frontend (5 minutes)
1. Connect repository
2. Set root directory: `frontend`
3. Set `NEXT_PUBLIC_API_URL`
4. Deploy

### 4. Update CORS (2 minutes)
1. Add frontend URL to backend `CORS_ORIGINS`
2. Redeploy backend

**Total Time: ~20-30 minutes**

📖 **Detailed instructions:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📋 Environment Variables

### Backend (Render)
```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/inventory_db
MONGODB_DB_NAME=inventory_db
JWT_SECRET_KEY=[strong-random-secret-32-chars-minimum]
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## ✅ Features

### 🔐 Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (Owner/Buyer)
- ✅ Secure password hashing (bcrypt)
- ✅ Protected API routes

### 📦 Inventory Management
- ✅ CRUD operations (Owner only)
- ✅ Unique QR code generation
- ✅ Stock management
- ✅ Category organization
- ✅ Low stock alerts

### 🛒 Shopping & Billing
- ✅ Add to cart (manual & QR)
- ✅ Cart management
- ✅ Checkout process
- ✅ Order creation
- ✅ Bill/receipt generation
- ✅ Order history

### 📱 QR Code Features
- ✅ QR code generation (Owner)
- ✅ QR code scanning (camera)
- ✅ QR code upload (image file)
- ✅ Public QR lookup (no login required)
- ✅ Token-based architecture (no embedded data)

### 🔒 Security
- ✅ JWT token validation
- ✅ CORS protection
- ✅ Rate limiting (public endpoints)
- ✅ Input validation
- ✅ HTTPS enforced

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Complete step-by-step deployment guide with troubleshooting |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Verification checklist for deployment |
| [QUICK_START.md](./QUICK_START.md) | Quick reference for deployment |
| [README.md](./README.md) | Project overview and development setup |

---

## 🔍 Key Endpoints

### Public (No Auth)
- `GET /health` - Health check
- `GET /items/qr/:qrToken` - Public QR lookup (rate limited)

### Authentication
- `POST /auth/register` - Register buyer
- `POST /auth/login` - Login (owner/buyer)

### Inventory (JWT Required)
- `GET /items` - List all items
- `GET /items/:id` - Get item details
- `POST /items` - Create item (Owner only)
- `PUT /items/:id` - Update item (Owner only)
- `DELETE /items/:id` - Delete item (Owner only)
- `GET /items/:id/qr-image` - Get QR code image

### Orders (JWT Required)
- `POST /orders` - Create order (Buyer only)
- `GET /orders` - List orders (Buyer: own orders, Owner: all orders)
- `GET /orders/:id` - Get order details

---

## 🧪 Testing

### Post-Deployment Verification

1. **Backend Health:**
   ```bash
   curl https://your-backend.onrender.com/health
   ```

2. **Public QR Lookup:**
   ```bash
   curl https://your-backend.onrender.com/items/qr/TEST-TOKEN
   ```

3. **Frontend:**
   - Visit your Vercel URL
   - Test public QR scanning
   - Register buyer account
   - Test cart & checkout
   - Login as owner
   - Test inventory management

📋 **Full checklist:** See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 🔐 Security Notes

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use strong, random JWT secret (32+ characters)
   - Rotate secrets periodically

2. **MongoDB:**
   - Use strong database passwords
   - URL-encode passwords if they contain special characters
   - Restrict IP whitelist in production

3. **CORS:**
   - Only allow your frontend domain
   - Never use `*` in production

4. **HTTPS:**
   - Automatically provided by Vercel and Render
   - Always use HTTPS in production

---

## 📊 Production URLs

After deployment, you'll have:

```
Frontend:  https://your-project.vercel.app
Backend:   https://your-backend.onrender.com
Database:  MongoDB Atlas (Cloud)
```

---

## 🆘 Support

### Common Issues

- **CORS errors:** Update `CORS_ORIGINS` in backend env vars
- **MongoDB connection failed:** Check IP whitelist and password encoding
- **Build fails:** Verify all dependencies in `requirements.txt`
- **Backend sleeps:** Normal on free tier - first request takes ~30s

### Documentation

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/

---

## 🎯 Deployment Status

✅ **Production-Ready:**
- ✅ Backend configured for Render
- ✅ Frontend configured for Vercel
- ✅ MongoDB Atlas integration
- ✅ Environment variables documented
- ✅ Deployment guides created
- ✅ Security best practices implemented

---

## 📝 License

MIT

---

**Ready to deploy?** Start with [DEPLOYMENT.md](./DEPLOYMENT.md) 🚀
