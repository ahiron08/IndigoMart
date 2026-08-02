import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { getDatabaseState } from './config/database.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import addressRoutes from './routes/address.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import cartRoutes from './routes/cart.routes.js';
import categoryRoutes from './routes/category.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import productRoutes from './routes/product.routes.js';
import searchRoutes from './routes/search.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'https://*.cloudinary.com'],
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_URL.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not permitted by CORS policy.'));
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === 'production' ? 600 : 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_request, response) => {
  const database = getDatabaseState();
  const isHealthy = database === 'connected';

  response.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'IndigoMart API is healthy.' : 'IndigoMart API is not ready.',
    data: {
      environment: env.NODE_ENV,
      database,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.get('/', (_request, response) => {
  response.status(200).json({
    name: 'IndigoMart API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/shipping', shippingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;