import type { Request } from 'express';

export type AuthenticatedImpersonation = {
  sessionId: string;
  adminId: string;
  adminEmail: string;
  adminFirstName: string;
  expiresAt: string;
};

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email?: string;
    role?: string;
    impersonation?: AuthenticatedImpersonation;
  };
};
