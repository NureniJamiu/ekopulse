import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../config/clerk';
import { Server as SocketIOServer } from 'socket.io';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
  io?: SocketIOServer;
}

const clerkAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log(`[ClerkAuth] Authenticating request to: ${req.method} ${req.path}`);
  console.log(`[ClerkAuth] Authorization header:`, req.headers.authorization ? 'Present' : 'Missing');
  console.log(`[ClerkAuth] Session cookie:`, req.headers.cookie ? 'Present' : 'Missing');

  try {
    requireAuth(req, res, (error) => {
      if (error) {
        console.error(`[ClerkAuth] Authentication failed:`, error.message);
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource',
          details: error.message
        });
      }
      console.log(`[ClerkAuth] Authentication successful for user:`, req.auth?.userId);
      next();
    });
  } catch (error: any) {
    console.error(`[ClerkAuth] Authentication error:`, error.message);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or missing authentication credentials',
      details: error.message
    });
  }
};

export default clerkAuth;
