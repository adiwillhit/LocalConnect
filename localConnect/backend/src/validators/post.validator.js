import { z } from 'zod';
import { POST_CATEGORIES } from '../models/Post.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createPostSchema = z.object({
  communityId: z.string().regex(objectIdRegex, 'Invalid communityId'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().trim().min(1, 'Content is required').max(5000),
  category: z.enum(POST_CATEGORIES).optional().default('General'),
});

export const updatePostSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    category: z.enum(POST_CATEGORIES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content is required').max(1000),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content is required').max(1000),
});

