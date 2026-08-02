import { Router } from 'express';
import { getQRInfo, generatePaymentQR, adminVerifyPayment, adminGetPendingPayments, adminGetAllPayments } from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/qr-info', getQRInfo);
router.post('/generate-qr', authenticate, generatePaymentQR);

router.use(authenticate);

router.get('/admin/pending', authorize('admin'), adminGetPendingPayments);
router.get('/admin/all', authorize('admin'), adminGetAllPayments);
router.post('/admin/verify', authorize('admin'), adminVerifyPayment);

export default router;