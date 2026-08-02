import { Router } from 'express';

import {
  activateSeller,
  adminApproveProduct,
  adminCreateCategory,
  adminDeleteCategory,
  adminDeleteProduct,
  adminFeatureProduct,
  adminGetCategories,
  adminRejectProduct,
  adminRestoreProduct,
  adminUnfeatureProduct,
  adminUpdateCategory,
  adminUpdateOrderStatus,
  approveSeller,
  banUser,
  deleteSeller,
  deleteUser,
  getAllOrders,
  getAllProducts,
  getDashboardStats,
  getEmbeddingStats,
  getMissingEmbeddings,
  getSeller,
  getSellers,
  getUsers,
  rebuildAllEmbeddings,
  rebuildProductEmbedding,
  rejectSeller,
  suspendSeller,
  unbanUser,
} from '../controllers/admin.controller.js';
import {
  createCoupon,
  deleteCoupon,
  getCoupon,
  getCoupons,
  updateCoupon,
  validateCoupon,
} from '../controllers/coupon.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, authorize('admin'));

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboardStats);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', getUsers);
router.put('/user/:id/ban', banUser);
router.put('/user/:id/unban', unbanUser);
router.delete('/user/:id', deleteUser);

// ─── Sellers ──────────────────────────────────────────────────────────────────
router.get('/sellers', getSellers);
router.get('/seller/:id', getSeller);
router.put('/seller/:id/approve', approveSeller);
router.put('/seller/:id/reject', rejectSeller);
router.put('/seller/:id/suspend', suspendSeller);
router.put('/seller/:id/activate', activateSeller);
router.delete('/seller/:id', deleteSeller);

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products', getAllProducts);
router.delete('/product/:id', adminDeleteProduct);
router.put('/product/:id/restore', adminRestoreProduct);
router.put('/product/:id/approve', adminApproveProduct);
router.put('/product/:id/reject', adminRejectProduct);
router.put('/product/:id/feature', adminFeatureProduct);
router.put('/product/:id/unfeature', adminUnfeatureProduct);

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders', getAllOrders);
router.put('/order/:id/status', adminUpdateOrderStatus);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', adminGetCategories);
router.post('/categories', adminCreateCategory);
router.put('/categories/:id', adminUpdateCategory);
router.delete('/categories/:id', adminDeleteCategory);

// ─── Coupons ──────────────────────────────────────────────────────────────────
router.get('/coupons', getCoupons);
router.get('/coupons/:id', getCoupon);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// ─── Coupon Validation (public-ish, but still admin-only for safety) ──────────
router.post('/coupons/validate', validateCoupon);

// ─── Embedding / Search ───────────────────────────────────────────────────────
router.get('/search/embeddings/stats', getEmbeddingStats);
router.get('/search/embeddings/missing', getMissingEmbeddings);
router.post('/search/embeddings/rebuild-all', rebuildAllEmbeddings);
router.post('/search/embeddings/rebuild/:productId', rebuildProductEmbedding);

export default router;