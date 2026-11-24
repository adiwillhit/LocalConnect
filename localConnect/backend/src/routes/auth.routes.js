import { Router } from 'express';
import { getMe, login, logout, refreshToken, register } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { createAuthRateLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from '../validators/auth.validator.js';

const router = Router();
const authLimiter = createAuthRateLimiter();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/logout', validate(logoutSchema), logout);
router.get('/me', authenticate, getMe);

export default router;

