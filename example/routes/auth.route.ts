import { router } from '../typedRouter';
import { z } from 'zod';
import { getProfile, updateProfile } from '../controllers/auth.controller';

// Example routes that use authentication middleware
// In real usage, you'd apply authMiddleware to these routes

// GET /profile - Get current user profile
router.get('/profile', {
  meta: { summary: 'Get current user profile', tags: ['Auth'] },
  request: {},
  responses: {
    200: z.object({
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
      }),
      tokenInfo: z.object({
        token: z.string(),
        expiresAt: z.number().optional(),
      }),
    }),
    401: z.object({ message: z.string() }),
  },
  handler: getProfile,
});

// PATCH /profile - Update current user profile
router.patch('/profile', {
  meta: { summary: 'Update current user profile', tags: ['Auth'] },
  request: {
    body: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  },
  responses: {
    200: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      updatedBy: z.string(),
    }),
    401: z.object({ message: z.string() }),
  },
  handler: updateProfile,
});
