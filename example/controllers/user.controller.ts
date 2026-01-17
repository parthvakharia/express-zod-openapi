import { CreateUserBodyType, UserType, UpdateUserBodyType, GetUserByIdRequestParamsType } from '../types';
import { HandlerContext } from '../../src';

// In-memory user store for demonstration purposes
const users = new Map<string, UserType>();

// GET /users/:id handler
export const getUserById = ({ parsed }: HandlerContext<{ params: GetUserByIdRequestParamsType }>) => {
  const user = users.get(parsed.params.id);
  if (!user) {
    return { message: 'User not found' };
  }
  return user;
};

// POST /users handler
export const createUser = ({ parsed }: HandlerContext<{ body: CreateUserBodyType }>) => {
  const id = String(users.size + 1);
  const body = parsed.body;
  const newUser: UserType = {
    id,
    name: body.name,
    email: body.email,
    status: body.status ?? 'active',
  };
  users.set(id, newUser);
  return newUser;
};

// PATCH /users/:id handler
export const updateUser = ({ parsed }: HandlerContext<{
  params: GetUserByIdRequestParamsType;
  body: UpdateUserBodyType;
}>) => {
  const existing = users.get(parsed.params.id);
  if (!existing) {
    return { message: 'User not found' };
  }
  const body = parsed.body;
  const updated: UserType = {
    ...existing,
    name: body.name ?? existing.name,
    email: body.email ?? existing.email,
    status: body.status ?? existing.status,
  };
  users.set(parsed.params.id, updated);
  return updated;
};