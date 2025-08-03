import { Server as SocketIOServer } from 'socket.io';
import { Document } from 'mongoose';
import { Request, Response } from 'express';

interface AuthedUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string;
  lastName?: string;
}

interface IAgency extends Document {
  _id: any;
  name: string;
  email: string;
  verified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      io?: SocketIOServer;
      user?: AuthedUser;
      authenticatedAgency?: IAgency;
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
