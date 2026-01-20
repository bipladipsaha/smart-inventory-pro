# Smart Inventory Management System

A production-ready inventory management system with QR code scanning capabilities, built with Flask (backend) and Next.js (frontend).

## Features

- 🔐 **JWT Authentication** - Secure login/registration with bcrypt password hashing
- 👥 **Role-Based Access Control** - Owner (full CRUD) and Buyer (read-only) roles
- 📦 **Inventory Management** - Add, update, delete items with real-time validation
- 📱 **QR Code Generation** - Unique QR codes for each product
- 📷 **QR Code Scanning** - Browser-based camera scanning for quick product lookup
- 🌐 **Public QR Lookup** - Scan products WITHOUT login (buyers, staff, customers)
- 🚦 **Rate Limiting** - Protection against API abuse
- ⚠️ **Low Stock Alerts** - Visual indicators for items with quantity < 10
- 🎨 **Modern UI** - Clean interface with Tailwind CSS and shadcn/ui components

## Tech Stack

### Backend
- **Framework**: Flask 3.0
- **Database**: MongoDB (PyMongo)
- **Authentication**: JWT (PyJWT)
- **Password Hashing**: bcrypt
- **QR Code Generation**: qrcode

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **QR Scanning**: html5-qrcode

## Project Structure

```
wp/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # Flask app factory
│   │   ├── config.py         # Environment configuration
│   │   ├── db.py             # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── auth.py       # JWT authentication middleware
│   │   │   └── rate_limit.py # Rate limiting for public endpoints
│   │   ├── models/
│   │   │   ├── user.py       # User model
│   │   │   └── inventory.py  # Inventory model (with public serialization)
│   │   └── routes/
│   │       ├── auth.py       # Auth endpoints
│   │       └── inventory.py  # Inventory CRUD + Public QR lookup
│   ├── requirements.txt
│   ├── run.py                # Entry point
│   └── .env                  # Environment variables
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── login/page.tsx        # Login page
│   │   │   ├── register/page.tsx     # Registration page
│   │   │   ├── scan/page.tsx         # PUBLIC QR scanner (no auth)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx          # Main dashboard
│   │   │       └── scan/page.tsx     # Authenticated QR scanner
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Navigation bar
│   │   │   ├── ItemDialog.tsx        # Add/Edit item modal
│   │   │   └── QRModal.tsx           # QR code display modal
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Authentication context
│   │   └── lib/
│   │       └── api.ts                # API helper (includes public lookup)
│   └── .env.local            # Frontend environment
└── .env.example              # Example environment file
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |

### Inventory (Protected)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/items` | Get all items | Owner, Buyer |
| GET | `/items/:id` | Get item by ID | Owner, Buyer |
| GET | `/items/lookup/:code` | Get full item by QR code | Owner, Buyer |
| POST | `/items` | Create new item | Owner only |
| PUT | `/items/:id` | Update item | Owner only |
| DELETE | `/items/:id` | Delete item | Owner only |
| GET | `/items/:id/qr-image` | Get QR code image | Owner, Buyer |

### Public API (No Auth Required)
| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/items/qr/:qrToken` | Get product info by QR token | 30 req/min |

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=inventory_db
   JWT_SECRET_KEY=your-secure-secret-key
   JWT_EXPIRATION_HOURS=24
   ```

5. Start the server:
   ```bash
   python run.py
   ```

   Backend will run at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   Frontend will run at `http://localhost:3000`

## QR Code Architecture

### Core Principle
QR codes contain **ONLY an immutable token** (e.g., `INV-A1B2C3D4E5F6`), never product data. This ensures:
- Product info is always live and accurate
- No stale data in printed QR codes
- Secure: QR doesn't expose sensitive business data

### QR Code Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    OWNER FLOW                                │
├─────────────────────────────────────────────────────────────┤
│  1. Owner creates item via Dashboard                        │
│  2. Backend generates unique qrToken: "INV-XXXXXXXX"        │
│  3. QR code image generated (contains ONLY the token)       │
│  4. Owner downloads/prints QR and attaches to shelf/product │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BUYER/STAFF FLOW (NO LOGIN)                     │
├─────────────────────────────────────────────────────────────┤
│  1. User visits /scan page (no authentication required)     │
│  2. Scans QR code using phone camera                        │
│  3. App reads token from QR                                 │
│  4. Calls PUBLIC API: GET /items/qr/:qrToken                │
│  5. Displays LIVE product data: name, price, quantity       │
└─────────────────────────────────────────────────────────────┘
```

### Public QR Lookup Response
```json
{
  "name": "Basmati Rice",
  "category": "Grains",
  "price": 60,
  "quantity": 45,
  "updatedAt": "2026-01-18T10:20:00"
}
```

### Real-World Workflows Supported

| Scenario | How It Works |
|----------|-------------|
| **Warehouse Stock Verification** | Staff scans QR to verify current quantity |
| **Shelf Price Checking** | Customers scan to see current price |
| **Buyer Self-Service** | No staff needed - scan and check availability |
| **Inventory Audits** | Quick scanning for stock counts |
| **IoT Integration Ready** | Token-based architecture supports sensors |

## Authentication Flow

1. User registers with name, email, password, and role (owner/buyer)
2. Server hashes password with bcrypt and stores user in MongoDB
3. Server generates JWT token with user ID and expiration
4. Token is stored in localStorage on the client
5. All protected API requests include the token in Authorization header
6. Server validates token and checks user role for each request

## Deployment Notes

### Backend (Production)

1. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
   ```

2. Set strong `JWT_SECRET_KEY` environment variable

3. Use MongoDB Atlas for cloud database

4. Enable HTTPS via reverse proxy (nginx)

### Frontend (Production)

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Vercel, Netlify, or similar:
   ```bash
   npx vercel
   ```

3. Set `NEXT_PUBLIC_API_URL` to production backend URL

### Security Considerations

- Change `JWT_SECRET_KEY` to a strong, random value in production
- Use HTTPS for all connections
- Configure CORS properly for production domains
- Use environment variables for all secrets
- MongoDB should use authentication in production

## License

MIT
