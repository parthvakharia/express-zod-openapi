import { HandlerContext } from '../../src';
import { AuthRequest } from '../types';

// Now you can use custom Request type with HandlerContext
export const getProfile = ({ req, parsed }: HandlerContext<{}, AuthRequest>) => {
  // req.user is now fully typed!
  const user = req.user;
  const token = req.token;
  
  if (!user) {
    return { message: 'User not found' };
  }

  return {
    user,
    tokenInfo: {
      token: token?.substring(0, 10) + '...',
      expiresAt: req.decodedToken?.exp,
    },
  };
};

export const updateProfile = ({ req, parsed }: HandlerContext<{
  body: { name: string; email: string };
}, AuthRequest>) => {
  const user = req.user;
  const { name, email } = parsed.body;

  if (!user) {
    return { message: 'Unauthorized' };
  }

  // Update user with new data
  return {
    id: user.id,
    name,
    email,
    updatedBy: user.email,
  };
};
