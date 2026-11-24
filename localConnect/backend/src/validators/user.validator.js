import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    bio: z.string().trim().max(300).optional(),
    location: z.string().trim().min(2).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const updateLocationSchema = z.object({
  location: z.string().trim().min(2, 'Location must be at least 2 characters').max(100),
});

