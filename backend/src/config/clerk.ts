import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

interface ClerkConfig {
  publishableKey: string;
  secretKey: string;
}

// Validate environment variables
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY environment variable is required');
}

if (!process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error('CLERK_PUBLISHABLE_KEY environment variable is required');
}

const clerkConfig: ClerkConfig = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY as string,
  secretKey: process.env.CLERK_SECRET_KEY as string,
};

export const requireAuth = ClerkExpressRequireAuth();
export { clerkConfig };
