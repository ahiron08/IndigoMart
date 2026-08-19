import { Router } from 'express';

import {
  calculateShipping,
  checkServiceabilityRoute,
  getProductDimensions,
} from '../controllers/shipping.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  calculateShippingSchema,
  serviceabilitySchema,
  productDimensionsSchema,
} from '../validators/shipping.validator.js';

const router = Router();

router.get('/serviceability', validate(serviceabilitySchema), checkServiceabilityRoute);

router.post('/calculate', validate(calculateShippingSchema), calculateShipping);

router.get('/dimensions/:productId', validate(productDimensionsSchema), getProductDimensions);

export default router;