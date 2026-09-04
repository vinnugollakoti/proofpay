import { Request, Response } from 'express';
import { db } from '../db/store.js';

export class AuthController {
  static async getSession(req: Request, res: Response) {
    // For demo convenience, returns current active client user or requested role
    const role = (req.query.role as string) || 'CLIENT';
    const user = Array.from(db.users.values()).find((u) => u.role === role);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const org = user.organizationId ? db.organizations.get(user.organizationId) : undefined;
    return res.json({ user, organization: org });
  }

  static async listUsers(req: Request, res: Response) {
    return res.json({
      users: Array.from(db.users.values()),
      organizations: Array.from(db.organizations.values()),
    });
  }
}
