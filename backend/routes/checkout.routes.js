import { Router } from 'express';
import { previewCheckout, createOrder } from '../controllers/checkout.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/preview', previewCheckout);
router.post('/place', createOrder);

export default router;