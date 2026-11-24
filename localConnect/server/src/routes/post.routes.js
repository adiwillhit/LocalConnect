import { Router } from 'express';
import {
  addComment,
  getCommentsByPost,
} from '../controllers/comment.controller.js';
import {
  createPost,
  deletePost,
  getPopularPosts,
  getPostById,
  getPostLikes,
  getPosts,
  likePost,
  unlikePost,
  updatePost,
} from '../controllers/post.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createCommentSchema,
  createPostSchema,
  updatePostSchema,
} from '../validators/post.validator.js';

const router = Router();

router.get('/', getPosts);
router.get('/popular', getPopularPosts);
router.post('/', authenticate, validate(createPostSchema), createPost);
router.get('/:id', getPostById);
router.patch('/:id', authenticate, validate(updatePostSchema), updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, likePost);
router.delete('/:id/like', authenticate, unlikePost);
router.get('/:id/likes', getPostLikes);

router.get('/:postId/comments', getCommentsByPost);
router.post('/:postId/comments', authenticate, validate(createCommentSchema), addComment);

export default router;

