import { Router } from 'express';

import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refresh,
  register,
  registerAsCustomer,
  registerAsSeller,
  resetPassword,
  updateCurrentUser,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadGovtId } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  customerRegisterSchema,
  sellerRegisterSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/register/customer', validate(customerRegisterSchema), registerAsCustomer);
router.post('/register/seller', uploadGovtId, validate(sellerRegisterSchema), registerAsSeller);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.patch('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, updateCurrentUser);

export default router;