import { Router } from 'express';
import {
  createCommunity,
  deleteCommunity,
  getCommunities,
  getCommunityById,
  getCommunityMembers,
  getCommunityPosts,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
} from '../controllers/community.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createCommunitySchema,
  updateCommunitySchema,
} from '../validators/community.validator.js';

const router = Router();

router.get('/', getCommunities);
router.post('/', authenticate, validate(createCommunitySchema), createCommunity);
router.get('/:id', getCommunityById);
router.patch('/:id', authenticate, validate(updateCommunitySchema), updateCommunity);
router.delete('/:id', authenticate, deleteCommunity);
router.post('/:id/join', authenticate, joinCommunity);
router.delete('/:id/join', authenticate, leaveCommunity);
router.post('/:id/leave', authenticate, leaveCommunity);
router.get('/:id/members', getCommunityMembers);
router.get('/:id/posts', getCommunityPosts);

export default router;

