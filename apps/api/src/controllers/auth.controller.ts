import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  static async getSession(req: Request, res: Response) {
    const role = (req.query.role as string) || 'CLIENT';
    logger.privy(`GET /api/auth/session — querying user session for role: "${role}"`);

    const user = Array.from(db.users.values()).find((u) => u.role === role);
    if (!user) {
      const errorMsg = `User with role "${role}" not found in session registry`;
      logger.privyError(errorMsg, { availableRoles: Array.from(db.users.values()).map((u) => u.role) });
      return res.status(404).json({
        error: errorMsg,
        code: 'USER_NOT_FOUND',
      });
    }

    const org = user.organizationId ? db.organizations.get(user.organizationId) : undefined;
    logger.privy(`Session resolved for user "${user.privyUserId}" (${user.walletAddress}) — Org: ${org?.name || 'Individual'}`);

    return res.json({ user, organization: org });
  }

  static async listUsers(req: Request, res: Response) {
    const users = Array.from(db.users.values());
    const organizations = Array.from(db.organizations.values());
    logger.privy(`GET /api/auth/users — returning ${users.length} user(s) and ${organizations.length} organization(s)`);

    return res.json({
      users,
      organizations,
    });
  }
}
