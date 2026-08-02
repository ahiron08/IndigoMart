import { Router } from 'express';

import { addItem, readCart, removeAllItems, removeItem, updateItem } from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { addCartItemSchema, productParamSchema, updateCartItemSchema } from '../validators/cart.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', readCart);
router.post('/items', validate(addCartItemSchema), addItem);
router.patch('/items/:productId', validate(updateCartItemSchema), updateItem);
router.delete('/items/:productId', validate(productParamSchema), removeItem);
router.delete('/', removeAllItems);

export default router;
