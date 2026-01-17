import { z } from 'zod';
import { withSchemaName } from '../../src';

export const UserStatus = z
  .enum(['active', 'inactive'])
  .describe('Current user status');

export const User = withSchemaName(
  z.object({
    id: z.string().describe('User identifier'),
    name: z.string().describe('Full name'),
    email: z.string().email().describe('Email address'),
    status: UserStatus,
  }),
  'User'
);

export const CreateUserBody = z.object({
  name: z.string(),
  email: z.string().email(),
  status: UserStatus.optional(),
});

export const UpdateUserBody = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  status: UserStatus.optional().nullable(),
});

export const GetUserByIdRequestParams = z.object({ id: z.string() });

export type UserType = z.infer<typeof User>;
export type CreateUserBodyType = z.infer<typeof CreateUserBody>;
export type UpdateUserBodyType = z.infer<typeof UpdateUserBody>;
export type GetUserByIdRequestParamsType = z.infer<typeof GetUserByIdRequestParams>;