import { Server as SocketIOServer } from 'socket.io';
import { Document } from 'mongoose';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      io: SocketIOServer;
      agency?: Document & any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
}

export interface AgencyAuthenticatedRequest extends Request {
  agency?: Document & any;
}
