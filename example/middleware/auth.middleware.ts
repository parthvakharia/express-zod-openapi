import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

// Example auth middleware that adds user to request
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // Use dummy token for example purposes
  const token = authHeader ? authHeader.replace('Bearer ', '') : 'dummy-token-for-example';
  
  // Add custom properties to request
  (req as AuthRequest).token = token;
  (req as AuthRequest).decodedToken = {
    userId: '123',
    exp: Date.now() + 3600000,
  };
  (req as AuthRequest).user = {
    id: '123',
    email: 'user@example.com',
    name: 'John Doe',
  };

  next();
};
