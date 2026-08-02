import { Router } from 'express';

import {
  createMyProduct,
  deleteMyProduct,
  duplicateMyProduct,
  getMyProductById,
  getMyProducts,
  getProductByIdentifier,
  getProducts,
  getRelatedProductsById,
  hideMyProduct,
  searchAllProducts,
  unhideMyProduct,
  updateMyProduct,
} from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadProductImages } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  productIdentifierSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

const router = Router();

// Seller product management routes (authenticated) — must be before /:identifier
router.get('/mine', authenticate, authorize('creator', 'seller', 'admin'), getMyProducts);
router.get('/mine/:id', authenticate, authorize('creator', 'seller', 'admin'), getMyProductById);
router.post('/', authenticate, authorize('creator', 'seller', 'admin'), uploadProductImages, validate(createProductSchema), createMyProduct);
router.patch('/:id', authenticate, authorize('creator', 'seller', 'admin'), uploadProductImages, validate(updateProductSchema), updateMyProduct);
router.delete('/:id', authenticate, authorize('creator', 'seller', 'admin'), validate(productIdSchema), deleteMyProduct);
router.patch('/:id/hide', authenticate, authorize('creator', 'seller', 'admin'), validate(productIdSchema), hideMyProduct);
router.patch('/:id/unhide', authenticate, authorize('creator', 'seller', 'admin'), validate(productIdSchema), unhideMyProduct);
router.post('/:id/duplicate', authenticate, authorize('creator', 'seller', 'admin'), validate(productIdSchema), duplicateMyProduct);

// Public marketplace routes
router.get('/', validate(listProductsSchema), getProducts);
router.get('/search', searchAllProducts);
router.get('/filter', getProducts);
router.get('/:identifier', validate(productIdentifierSchema), getProductByIdentifier);
router.get('/:id/related', getRelatedProductsById);

export default router;