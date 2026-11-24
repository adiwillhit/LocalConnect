import { z } from 'zod';

export const createCommunitySchema = z.object({
  name: z.string().trim().min(2, 'Community name must be at least 2 characters').max(100),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(500),
  location: z.string().trim().min(2, 'Location must be at least 2 characters').max(100),
});

export const updateCommunitySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().min(5).max(500).optional(),
    location: z.string().trim().min(2).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

