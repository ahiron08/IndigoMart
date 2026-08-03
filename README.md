# IndigoMart

An e-commerce marketplace platform connecting independent brands and creators with customers. Built with a Node.js/Express + MongoDB backend and a React/Vite frontend.

## Architecture

- **`backend/`** — Node.js + Express REST API with MongoDB (Mongoose), JWT auth, Cloudinary image storage, and optional semantic search (OpenAI + Qdrant)
- **`frontend/`** — React 19 + Vite SPA with React Router, Tailwind CSS, and React Hook Form

## Deployment Targets

| Service | Platform | Directory |
|---|---|---|
| Frontend (React SPA) | **Vercel** | `frontend/` |
| Backend (Express API) | **Render** | `backend/` |
| Database | Mongo DB Atlas | — |

## Prerequisites

- Node.js >= 20.19.0
- MongoDB (Atlas or local)
- Cloudinary account (for image uploads)

## Local Development

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
cd backend && cp .env.example .env
```

Required values at minimum:
- `MONGODB_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` — random string (min 32 chars)
- `JWT_REFRESH_SECRET` — random string (min 32 chars)

Optional for full functionality:
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — image uploads
- `SMTP_*` — password reset emails
- `OPENAI_API_KEY` + `QDRANT_URL` — semantic search
- `DELHIVERY_API_KEY` — shipping calculations

**Frontend** — copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cd frontend && cp .env.example .env.local
```

### 3. Run the app

```bash
# Backend on http://localhost:5000
cd backend && npm run dev

# Frontend on http://localhost:5173
cd frontend && npm run dev
```

### 4. Seed the database (optional)

```bash
cd backend
node scripts/createAdmin.js       # Create an admin user
node scripts/createCategories.js  # Seed product categories
node scripts/addProducts.js       # Add sample products
node scripts/initSearch.js        # Initialize semantic search
```

## Deployment: Backend (Render)

### Option A: Blueprint (Recommended)

1. Push this repository to GitHub.
2. In Render, select **New → Blueprint** and connect the repository.
3. Render will read `render.yaml` and create the **indigomart-api** web service.
4. For secrets (`sync: false` in `render.yaml`), set them manually in the Render dashboard under **Environment** tab.

### Option B: Manual Setup

1. Create a new **Web Service** in Render.
2. Connect the repository, set **Root Directory** to `backend`.
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Health Check Path**: `/api/health`
6. Add the required environment variables (see `backend/.env.example`):
   - `MONGODB_URI`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CLIENT_URL` — set to your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
   - `PASSWORD_RESET_URL` — set to `https://your-app.vercel.app/reset-password`
   - `NODE_ENV=production`
   - Optional: `CLOUDINARY_*`, `SMTP_*`, `OPENAI_API_KEY`, `QDRANT_*`, `DELHIVERY_API_KEY`

## Deployment: Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository.
2. Vercel will auto-detect the Vite framework and use `frontend/vercel.json`.
3. Set the **Root Directory** to `frontend` (if not auto-detected).
4. Add the environment variable in **Settings → Environment Variables**:
   - `VITE_API_URL` — set to your deployed Render API URL (e.g. `https://indigomart-api.onrender.com`)
5. Deploy. The `vercel.json` includes rewrites so React Router deep links work on refresh.

## Environment Variables

| Variable | Backend | Frontend | Required | Description |
|---|---|---|---|---|
| `NODE_ENV` | ✅ | | ✅ | `production` in deployment |
| `PORT` | ✅ | | ✅ | Render sets this automatically (default: 10000) |
| `CLIENT_URL` | ✅ | | ✅ | Comma-separated CORS origins |
| `MONGODB_URI` | ✅ | | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | | ✅ | JWT access signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | | ✅ | JWT refresh signing secret (min 32 chars) |
| `PASSWORD_RESET_URL` | ✅ | | ✅ | Frontend URL for password reset links |
| `VITE_API_URL` | | ✅ | ✅ | Backend API base URL for the frontend |
| `CLOUDINARY_*` | ✅ | | Optional | Cloudinary credentials for image uploads |
| `SMTP_*` | ✅ | | Optional | SMTP config for password reset emails |
| `EMBEDDING_MODEL` | ✅ | | Optional | OpenAI embedding model name |
| `EMBEDDING_DIMENSIONS` | ✅ | | Optional | Embedding vector dimensions |
| `ENABLE_SEMANTIC_SEARCH` | ✅ | | Optional | Enable/disable semantic search (`true`/`false`) |
| `QUERY_EXPANSION_ENABLED` | ✅ | | Optional | Enable/disable query expansion (`true`/`false`) |
| `OPENAI_API_KEY` | ✅ | | Optional | For semantic search embeddings |
| `QDRANT_URL` | ✅ | | Optional | Qdrant vector database URL |
| `QDRANT_API_KEY` | ✅ | | Optional | Qdrant vector database API key |
| `QDRANT_COLLECTION_NAME` | ✅ | | Optional | Qdrant collection name |
| `DELHIVERY_API_KEY` | ✅ | | Optional | Delhivery shipping API key |
| `QR_UPI_ID` | ✅ | | Optional | UPI ID for QR payments |
| `QR_PAYEE_NAME` | ✅ | | Optional | Payee name for QR payments |
| `JWT_ACCESS_EXPIRES_IN` | ✅ | | Optional | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | | Optional | Refresh token expiry (default: 7d) |
| `ACCESS_COOKIE_MS` | ✅ | | Optional | Access cookie max age in ms |
| `REFRESH_COOKIE_MS` | ✅ | | Optional | Refresh cookie max age in ms |
| `SMTP_HOST` | ✅ | | Optional | SMTP server host |
| `SMTP_PORT` | ✅ | | Optional | SMTP server port |
| `SMTP_SECURE` | ✅ | | Optional | Use TLS for SMTP (`true`/`false`) |
| `SMTP_USER` | ✅ | | Optional | SMTP username |
| `SMTP_PASSWORD` | ✅ | | Optional | SMTP password |
| `EMAIL_FROM` | ✅ | | Optional | From address for outgoing emails |

## API Endpoints

The backend exposes the following route groups under `/api`:

- `GET /api/health` — health check (used by Render)
- `/api/auth` — authentication (login, signup, refresh, logout)
- `/api/products` — product CRUD, search, related products
- `/api/categories` — product categories
- `/api/search` — search, suggestions, trending, similar
- `/api/cart` — shopping cart operations
- `/api/wishlist` — wishlist operations
- `/api/orders` — order management
- `/api/checkout` — checkout preview and order placement
- `/api/payment` — payment QR, verification
- `/api/shipping` — shipping calculation and serviceability
- `/api/admin` — admin operations
- `/api/seller` — seller dashboard
- `/api/address` — user addresses
- `/api/coupons` — coupon validation

## Scripts

Root `package.json`:

```bash
npm run dev:backend     # Start backend in dev mode
npm run dev:frontend    # Start frontend in dev mode
npm run build           # Build frontend for production
npm run start           # Start backend in production
npm run lint            # Lint both backend and frontend
```

## Documentation

- [Cloudinary Setup](backend/CLOUDINARY_SETUP.md)
- [Semantic Search](backend/SEMANTIC_SEARCH.md)