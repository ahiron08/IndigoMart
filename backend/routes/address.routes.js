import { Router } from 'express';
import {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMyAddresses);
router.post('/', createAddress);
router.get('/:id', getAddressById);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;