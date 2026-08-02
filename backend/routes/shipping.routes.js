import { Router } from 'express';
import { checkServiceabilityRoute, calculateShipping, getProductDimensions } from '../controllers/shipping.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/serviceability', checkServiceabilityRoute);
router.post('/calculate', authenticate, calculateShipping);
router.get('/dimensions/:productId', getProductDimensions);

export default router;