import { Router } from 'express';

import { addProduct, readWishlist, removeProduct } from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { productParamSchema } from '../validators/cart.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', readWishlist);
router.post('/:productId', validate(productParamSchema), addProduct);
router.delete('/:productId', validate(productParamSchema), removeProduct);

export default router;
