import { Router } from 'express';
import { deleteComment, updateComment } from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { updateCommentSchema } from '../validators/post.validator.js';

const router = Router();

router.patch('/:id', authenticate, validate(updateCommentSchema), updateComment);
router.delete('/:id', authenticate, deleteComment);

export default router;

