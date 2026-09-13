import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '@privy-io/node';
import { config } from '../config.js';
import { db } from '../db/store.js';

export type Principal = { userId: string; privyUserId?: string; role: string; mode: 'privy' | 'demo' };

declare global {
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}

function configuredPrivy() {
  return Boolean(
    config.privy.appId &&
      config.privy.verificationKey &&
      !config.privy.appId.includes('your_privy_app_id') &&
      !config.privy.verificationKey.includes('your_privy_verification_key')
  );
}

/** Require a verified Privy access token, or one of the explicitly seeded demo users. */
export async function requirePrincipal(req: Request, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (token && configuredPrivy()) {
    try {
      const claims = await verifyAuthToken({
        auth_token: token,
        app_id: config.privy.appId,
        verification_key: config.privy.verificationKey,
      });
      const user = Array.from(db.users.values()).find((candidate) => candidate.privyUserId === claims.user_id);
      if (!user) return res.status(403).json({ error: 'Complete Privy onboarding before accessing ProofPay.', code: 'ONBOARDING_REQUIRED' });
      req.principal = { userId: user.id, privyUserId: claims.user_id, role: user.role, mode: 'privy' };
      return next();
    } catch {
      return res.status(401).json({ error: 'Your Privy session is invalid or expired. Please sign in again.', code: 'INVALID_PRIVY_TOKEN' });
    }
  }

  // This fallback is intentionally narrow: it only exists for the documented local demo accounts.
  const demoUserId = req.header('x-proofpay-demo-user');
  const demoUser = demoUserId ? db.users.get(demoUserId) : undefined;
  if (demoUser && (demoUser.id === 'user-client-alice' || demoUser.id === 'user-freelancer-bob')) {
    req.principal = { userId: demoUser.id, role: demoUser.role, mode: 'demo' };
    return next();
  }

  return res.status(401).json({
    error: configuredPrivy() ? 'A verified Privy session is required.' : 'Sign in with a seeded demo account, or configure Privy verification keys.',
    code: 'AUTH_REQUIRED',
  });
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.principal) return res.status(401).json({ error: 'Authentication required.', code: 'AUTH_REQUIRED' });
    if (!roles.includes(req.principal.role)) return res.status(403).json({ error: 'You do not have permission for this action.', code: 'FORBIDDEN' });
    next();
  };
}
