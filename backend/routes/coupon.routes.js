import { Router } from 'express';
import { validateCoupon } from '../controllers/coupon.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Public route for users to validate a coupon during checkout
router.post('/validate', validateCoupon);

export default router;