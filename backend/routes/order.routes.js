import { Router } from 'express';
import {
  getMyOrders,
  getSellerOrderList,
  getOrder,
  adminGetAllOrders,
  updateStatus,
  updateTracking,
  updateOrderPayment,
} from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadPaymentScreenshot } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

// Buyer routes
router.get('/my', getMyOrders);
router.get('/:id', getOrder);

// Seller routes
router.get('/seller/list', authorize('seller', 'creator', 'admin'), getSellerOrderList);
router.patch('/:id/status', authorize('seller', 'creator', 'admin'), updateStatus);
router.patch('/:id/tracking', authorize('seller', 'admin'), updateTracking);
router.patch('/:id/payment', uploadPaymentScreenshot, updateOrderPayment);

// Admin routes
router.get('/admin/all', authorize('admin'), adminGetAllOrders);

export default router;