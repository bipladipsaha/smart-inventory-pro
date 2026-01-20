# ⚡ Quick Deployment Reference

## 🎯 Essential URLs After Deployment

```
Frontend:  https://your-project.vercel.app
Backend:   https://your-backend.onrender.com
Database:  MongoDB Atlas (Cloud)
```

---

## 🔑 Environment Variables Quick Reference

### Backend (Render)
```bash
MONGODB_URI=mongodb+srv://user:PASSWORD@cluster.mongodb.net/inventory_db
MONGODB_DB_NAME=inventory_db
JWT_SECRET_KEY=[generate with: openssl rand -hex 32]
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 📋 Deployment Steps (TL;DR)

1. **MongoDB Atlas:**
   - Create free cluster
   - Create database user (remember password - URL encode if needed)
   - Whitelist IP: `0.0.0.0/0`
   - Get connection string

2. **Render (Backend):**
   - Connect GitHub repo
   - Root directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - Set environment variables
   - Deploy

3. **Vercel (Frontend):**
   - Connect GitHub repo
   - Root directory: `frontend`
   - Set `NEXT_PUBLIC_API_URL`
   - Deploy

4. **Update CORS:**
   - Add frontend URL to backend `CORS_ORIGINS`
   - Redeploy backend

---

## ✅ Verification Commands

```bash
# Backend health
curl https://your-backend.onrender.com/health

# Should return: {"status": "healthy"}

# Test public QR endpoint
curl https://your-backend.onrender.com/items/qr/TEST

# Should return: {"error": "Item not found"}
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| CORS error | Update `CORS_ORIGINS` in backend env vars |
| MongoDB connection failed | Check IP whitelist and password encoding |
| Build fails | Verify `requirements.txt` has all deps |
| Backend sleeps | Normal on free tier - first request takes ~30s |

---

**📖 Full guide: See [DEPLOYMENT.md](./DEPLOYMENT.md)**
