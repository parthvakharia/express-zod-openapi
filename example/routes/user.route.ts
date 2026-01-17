import { router } from '../typedRouter';
import { z } from 'zod';
import { User, CreateUserBody, UpdateUserBody, GetUserByIdRequestParams } from '../types/user.type';
import { getUserById, createUser, updateUser } from '../controllers/user.controller';

// GET /users/:id
router.get('/users/:id', {
  meta: { summary: 'Get a user by ID', tags: ['Users'] },
  request: {
    params: GetUserByIdRequestParams,
  },
  responses: {
    200: User,
    404: z.object({ message: z.string() }),
  },
  handler: getUserById,
});

// POST /users
router.post('/users', {
  meta: { summary: 'Create a new user', tags: ['Users'] },
  request: {
    body: CreateUserBody,
  },
  responses: {
    201: User,
    400: z.object({ message: z.string() }),
  },
  handler: createUser,
});

// PATCH /users/:id
router.patch('/users/:id', {
  meta: { summary: 'Update an existing user', tags: ['Users'] },
  request: {
    params: GetUserByIdRequestParams,
    body: UpdateUserBody,
  },
  responses: {
    200: User,
    404: z.object({ message: z.string() }),
  },
  handler: updateUser,
});
