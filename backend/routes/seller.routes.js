import { Router } from 'express';

import {
  getSellerDashboard,
  getSellerOrders,
  getSellerProducts,
  getSellerProfile,
  updateOrderStatus,
  updateSellerProfile,
} from '../controllers/seller.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, authorize('seller'));

router.get('/dashboard', getSellerDashboard);
router.get('/profile', getSellerProfile);
router.put('/profile', updateSellerProfile);
router.get('/products', getSellerProducts);
router.get('/orders', getSellerOrders);
router.patch('/order/:id/status', updateOrderStatus);

export default router;