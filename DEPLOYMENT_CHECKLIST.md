# ✅ Deployment Verification Checklist

Use this checklist to verify your production deployment is complete and working correctly.

---

## 🔐 Pre-Deployment

- [ ] Code pushed to version control (GitHub/GitLab/Bitbucket)
- [ ] All environment variables documented
- [ ] Strong JWT secret key generated (32+ characters)
- [ ] MongoDB Atlas account created

---

## 🗄️ MongoDB Atlas Setup

- [ ] Free cluster created and running
- [ ] Database user created with read/write permissions
- [ ] Password documented (and URL-encoded if needed)
- [ ] Network access configured (IP whitelist: `0.0.0.0/0` for development)
- [ ] Connection string formatted correctly
- [ ] Database name: `inventory_db`

**Connection String Format:**
```
mongodb+srv://USERNAME:URL_ENCODED_PASSWORD@cluster.mongodb.net/inventory_db?retryWrites=true&w=majority
```

---

## 🔧 Backend Deployment (Render)

### Configuration
- [ ] Render account created
- [ ] Repository connected
- [ ] Root directory set to `backend`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- [ ] Python runtime selected

### Environment Variables Set
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `MONGODB_DB_NAME` - Set to `inventory_db`
- [ ] `JWT_SECRET_KEY` - Strong random secret (32+ chars)
- [ ] `JWT_EXPIRATION_HOURS` - Set to `24`
- [ ] `CORS_ORIGINS` - Initially empty or placeholder

### Deployment
- [ ] Service deployed successfully
- [ ] No build errors in logs
- [ ] Service status: "Live" or "Running"
- [ ] Backend URL obtained: `https://your-backend.onrender.com`

### Testing
- [ ] Health check endpoint works:
  ```bash
  curl https://your-backend.onrender.com/health
  # Expected: {"status": "healthy"}
  ```
- [ ] Public QR endpoint accessible:
  ```bash
  curl https://your-backend.onrender.com/items/qr/TEST
  # Expected: {"error": "Item not found"} (404)
  ```
- [ ] Owner account seeded using `seed_owner.py`
- [ ] Owner credentials documented (change default password!)

---

## 🎨 Frontend Deployment (Vercel)

### Configuration
- [ ] Vercel account created
- [ ] Repository connected
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Build command: `npm run build` (default)

### Environment Variables Set
- [ ] `NEXT_PUBLIC_API_URL` - Backend Render URL

### Deployment
- [ ] Project deployed successfully
- [ ] No build errors in logs
- [ ] Deployment status: "Ready"
- [ ] Frontend URL obtained: `https://your-project.vercel.app`

---

## 🔗 Integration

- [ ] Backend `CORS_ORIGINS` updated with frontend URL
- [ ] Backend service redeployed (for CORS changes)
- [ ] CORS configured correctly (no wildcard `*` in production)

---

## 🧪 Functional Testing

### Public Features (No Login Required)
- [ ] Public QR scanning page accessible (`/scan`)
- [ ] QR code scanning works (camera)
- [ ] QR code upload works (image file)
- [ ] Product information displays correctly after scan
- [ ] Rate limiting works (30 requests/minute)

### Buyer Features
- [ ] Buyer registration page accessible (`/register`)
- [ ] Can register new buyer account
- [ ] Buyer login page accessible (`/login`)
- [ ] Can login with buyer credentials
- [ ] Buyer dashboard accessible after login
- [ ] Can add scanned products to cart
- [ ] Cart page displays items correctly (`/cart`)
- [ ] Can update item quantities in cart
- [ ] Can remove items from cart
- [ ] Checkout process works
- [ ] Order confirmation displays after checkout
- [ ] Bill/receipt generated correctly
- [ ] Orders page shows purchase history (`/orders`)
- [ ] Inventory stock decreases after purchase

### Owner Features
- [ ] Owner login works with seeded credentials
- [ ] Owner dashboard accessible
- [ ] Can view all inventory items
- [ ] Can create new inventory items
- [ ] Can edit existing inventory items
- [ ] Can delete inventory items
- [ ] QR code generation works for items
- [ ] Can download QR code images
- [ ] Can view all orders (owner dashboard)
- [ ] Owner cannot access buyer cart
- [ ] Owner cannot make purchases

### Security Testing
- [ ] Unauthenticated users cannot access protected routes
- [ ] Expired JWT tokens are rejected
- [ ] Invalid JWT tokens are rejected
- [ ] Buyers cannot access owner-only routes
- [ ] Owners cannot access buyer-only routes (cart/checkout)
- [ ] CORS blocks requests from unauthorized origins
- [ ] Rate limiting works on public endpoints

---

## 🗄️ Database Verification

### MongoDB Atlas Dashboard
- [ ] Can connect to cluster
- [ ] Database `inventory_db` exists
- [ ] Collection `users` exists and has owner user
- [ ] Collection `inventory` exists
- [ ] Collection `orders` exists
- [ ] Indexes created correctly:
  - `users.email` (unique)
  - `inventory.qrCode` (unique)
  - `inventory.category`
  - `inventory.createdBy`

### Data Integrity
- [ ] Owner user has role `owner`
- [ ] Test buyer user has role `buyer`
- [ ] Inventory items have unique QR codes
- [ ] Orders reference valid buyer and product IDs
- [ ] Stock quantities update correctly after purchases

---

## 🚀 Performance Checks

- [ ] Backend responds to health check in < 2 seconds
- [ ] Frontend loads in < 3 seconds
- [ ] API calls complete in reasonable time
- [ ] No memory leaks in backend (check Render logs)
- [ ] No excessive API calls from frontend

---

## 📊 Monitoring & Logs

- [ ] Render logs accessible and monitored
- [ ] Vercel logs accessible and monitored
- [ ] MongoDB Atlas monitoring enabled
- [ ] Error tracking set up (optional but recommended)

---

## 🔐 Security Hardening

- [ ] Default owner password changed
- [ ] Strong JWT secret key in use
- [ ] MongoDB password is strong and URL-encoded
- [ ] CORS origins restricted to frontend domain only
- [ ] HTTPS enforced (automatic on Vercel/Render)
- [ ] Environment variables not exposed in code
- [ ] No sensitive data in git history

---

## 📱 Mobile/Cross-Browser Testing

- [ ] Frontend works on Chrome
- [ ] Frontend works on Firefox
- [ ] Frontend works on Safari
- [ ] Frontend works on mobile browsers
- [ ] QR scanning works on mobile devices
- [ ] Responsive design works correctly

---

## 📚 Documentation

- [ ] Deployment documentation reviewed
- [ ] Environment variables documented
- [ ] Owner credentials secured and documented
- [ ] URLs documented for team
- [ ] Rollback procedure understood

---

## 🎉 Final Verification

### End-to-End Test Flow

1. **Public User:**
   - [ ] Visit frontend
   - [ ] Scan/upload QR code
   - [ ] View product details
   - [ ] Cannot add to cart (login required)

2. **Buyer Flow:**
   - [ ] Register new account
   - [ ] Login
   - [ ] Scan QR code
   - [ ] Add to cart
   - [ ] View cart
   - [ ] Checkout
   - [ ] View order confirmation
   - [ ] View order history

3. **Owner Flow:**
   - [ ] Login with owner credentials
   - [ ] Create inventory item
   - [ ] Generate QR code
   - [ ] Edit inventory item
   - [ ] View all orders
   - [ ] Verify stock updates after purchase

---

## ✅ Deployment Complete!

If all items are checked, your Smart Inventory & Billing System is production-ready!

**Next Steps:**
- Set up monitoring/alerting
- Configure custom domain (optional)
- Set up automated backups for MongoDB
- Consider upgrading to paid plans for better performance
- Set up CI/CD for automated deployments

---

**Last Updated:** After each deployment, verify critical paths are working.
