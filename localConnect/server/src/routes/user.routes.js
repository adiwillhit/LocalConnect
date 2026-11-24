import { Router } from 'express';
import { getMe } from '../controllers/auth.controller.js';
import {
  followUser,
  getFollowers,
  getFollowing,
  getUserProfile,
  getUserStats,
  unfollowUser,
  updateMyLocation,
  updateMyProfile,
} from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { updateLocationSchema, updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validate(updateProfileSchema), updateMyProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateMyProfile);
router.patch('/location', authenticate, validate(updateLocationSchema), updateMyLocation);
router.get('/:id', getUserProfile);
router.get('/:id/stats', getUserStats);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.post('/:id/follow', authenticate, followUser);
router.delete('/:id/follow', authenticate, unfollowUser);

export default router;

