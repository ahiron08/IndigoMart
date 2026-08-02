import { Router } from 'express';

import { getProductSimilar, getSuggestions, getTrending, searchProducts } from '../controllers/search.controller.js';

const router = Router();

router.get('/', searchProducts);
router.get('/suggestions', getSuggestions);
router.get('/trending', getTrending);
router.get('/:id/similar', getProductSimilar);

export default router;