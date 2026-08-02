# IndigoMart

An e-commerce marketplace platform connecting independent brands and creators with customers. Built with a Node.js/Express + MongoDB backend and a React/Vite frontend.

## Architecture

- **`backend/`** — Node.js + Express REST API with MongoDB (Mongoose), JWT auth, Cloudinary image storage, and optional semantic search (OpenAI + Qdrant)
- **`frontend/`** — React 19 + Vite SPA with React Router, Tailwind CSS, and React Hook Form

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

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:

```bash
cd frontend && cp .env.example .env
```

For local development, the default proxy settings work out of the box.

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

## Deployment (Render)

### Option A: Blueprint (Recommended)

1. Push this repository to GitHub.
2. In Render, select **New → Blueprint** and connect the repository.
3. Render will read `render.yaml` and create two services:
   - **indigomart-api** — Node.js web service
   - **indigomart-frontend** — Static site
4. For secrets (`sync: false` in `render.yaml`), set them manually in the Render dashboard under each service's **Environment** tab.

### Option B: Manual Setup

**Backend API:**
1. Create a new **Web Service** in Render.
2. Connect the repository, set **Root Directory** to `backend`.
3. Build: `npm install`, Start: `npm start`.
4. Add the required environment variables (see `backend/.env.example`).

**Frontend:**
1. Create a new **Static Site**.
2. Connect the repository, set **Root Directory** to `frontend`.
3. Build: `npm install && npm run build`, Publish: `dist`.
4. Add `VITE_API_URL` pointing to your deployed API URL (e.g. `https://indigomart-api.onrender.com`).
5. For SPA routing support on Render, a `_redirects` file is already included in `frontend/public/`.

### Required Environment Variables

| Variable | Backend | Frontend | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ | | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | | JWT refresh signing secret (min 32 chars) |
| `CLIENT_URL` | ✅ | | Comma-separated list of allowed CORS origins |
| `VITE_API_URL` | | ✅ | Backend API URL for the frontend |
| `PASSWORD_RESET_URL` | ✅ | | Frontend URL for password reset links |
| `CLOUDINARY_*` | Optional | | Cloudinary credentials for image uploads |
| `SMTP_*` | Optional | | SMTP config for emails |
| `OPENAI_API_KEY` | Optional | | For semantic search embeddings |
| `QDRANT_URL` | Optional | | Qdrant vector database URL |
| `DELHIVERY_API_KEY` | Optional | | Delhivery shipping API key |

## API Endpoints

The backend exposes the following route groups under `/api`:

- `POST /api/health` — health check (used by Render)
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