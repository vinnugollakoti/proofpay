import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { getPrisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { publicUser } from '../services/identity.service.js';

export class AuthController {
  /**
   * Dedicated authentication login endpoint for Client and Freelancer logins.
   * Authenticates against Supabase PostgreSQL database.
   */
  static async login(req: Request, res: Response) {
    const { email, password, role } = req.body;
    logger.privy(`POST /api/auth/login — attempt for email: "${email}", requested role: "${role}"`);

    if (!email || !password) {
      const errorMsg = 'Email and password are required for login';
      logger.privyError(errorMsg);
      return res.status(400).json({ error: errorMsg, code: 'MISSING_CREDENTIALS' });
    }

    const prisma = getPrisma();
    let user: any = null;
    let organization: any = null;

    if (prisma) {
      try {
        user = await prisma.user.findFirst({
          where: {
            email: email.toLowerCase().trim(),
          },
          include: {
            organization: true,
          },
        });
      } catch (err: any) {
        logger.dbError(`Failed to query user from Supabase: ${err.message}`);
      }
    }

    // Fallback to store if db unavailable
    if (!user) {
      user = Array.from(db.users.values()).find(
        (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
      );
      if (user && user.organizationId) {
        organization = db.organizations.get(user.organizationId);
      }
    } else {
      organization = user.organization;
    }

    if (!user) {
      const errorMsg = `No account found with email "${email}". Please verify credentials.`;
      logger.privyError(errorMsg);
      return res.status(401).json({ error: errorMsg, code: 'INVALID_CREDENTIALS' });
    }

    if (user.password && user.password !== password) {
      const errorMsg = `Invalid password for "${email}".`;
      logger.privyError(errorMsg);
      return res.status(401).json({ error: errorMsg, code: 'INVALID_CREDENTIALS' });
    }

    // If role requested, verify user has permission for that portal
    if (role && user.role !== role) {
      const errorMsg = `Access denied: Account "${email}" has role "${user.role}" and cannot access the ${role} portal.`;
      logger.privyError(errorMsg);
      return res.status(403).json({ error: errorMsg, code: 'ROLE_MISMATCH' });
    }

    logger.privy(`✅ Login successful for ${user.role}: "${user.name || user.email}"`);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || (user.role === 'CLIENT' ? 'Alice (ACME Design)' : 'Bob (Senior Engineer)'),
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        privyUserId: user.privyUserId,
        organizationId: user.organizationId,
      },
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            privyOrgId: organization.privyOrgId,
            walletAddress: organization.walletAddress,
            maxReleaseLimitUsdc: Number(organization.maxReleaseLimitUsdc || 5000),
          }
        : undefined,
    });
  }

  /** Maps a server-verified Privy DID to a local ProofPay profile. */
  static async syncPrivySession(req: Request, res: Response) {
    const principal = req.principal!;
    const { email, walletAddress, name, role } = req.body;
    let user = db.users.get(principal.userId);
    if (!user && principal.privyUserId) {
      user = Array.from(db.users.values()).find((candidate) => candidate.privyUserId === principal.privyUserId);
    }
    if (!user) {
      const requestedRole = role === 'FREELANCER' ? 'FREELANCER' : 'CLIENT';
      const address = typeof walletAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(walletAddress)
        ? walletAddress
        : '0x0000000000000000000000000000000000000001';
      const id = `user-${principal.privyUserId!.replace(/[^a-zA-Z0-9]/g, '').slice(-16)}`;
      user = {
        id,
        privyUserId: principal.privyUserId!,
        walletAddress: address,
        email: typeof email === 'string' ? email.toLowerCase() : undefined,
        name: typeof name === 'string' ? name.slice(0, 80) : undefined,
        role: requestedRole,
        organizationId: requestedRole === 'CLIENT' ? 'org-acme-design' : undefined,
        createdAt: new Date().toISOString(),
      };
      db.users.set(id, user);
    }
    const organization = user.organizationId ? db.organizations.get(user.organizationId) : undefined;
    return res.json({ success: true, user: publicUser(user), organization, authMode: 'privy' });
  }

  static async getSession(req: Request, res: Response) {
    const role = (req.query.role as string) || 'CLIENT';
    const email = req.query.email as string;
    logger.privy(`GET /api/auth/session — querying user session (role: "${role}", email: "${email || 'any'}")`);

    const prisma = getPrisma();
    let user: any = null;

    if (prisma) {
      try {
        user = await prisma.user.findFirst({
          where: email ? { email: email.toLowerCase().trim() } : { role },
          include: { organization: true },
        });
      } catch (err: any) {
        logger.dbError(`Failed to fetch session from Supabase: ${err.message}`);
      }
    }

    if (!user) {
      user = Array.from(db.users.values()).find((u) => (email ? u.email === email : u.role === role));
    }

    if (!user) {
      const errorMsg = `User with role "${role}" not found in session registry`;
      logger.privyError(errorMsg);
      return res.status(404).json({ error: errorMsg, code: 'USER_NOT_FOUND' });
    }

    const org = user.organization || (user.organizationId ? db.organizations.get(user.organizationId) : undefined);

    return res.json({
      user: {
        id: user.id,
        name: user.name || (user.role === 'CLIENT' ? 'Alice (ACME Design)' : 'Bob (Senior Engineer)'),
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        privyUserId: user.privyUserId,
        organizationId: user.organizationId,
      },
      organization: org,
    });
  }

  static async listUsers(req: Request, res: Response) {
    const prisma = getPrisma();
    let users: any[] = [];
    let organizations: any[] = [];

    if (prisma) {
      try {
        users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, walletAddress: true } });
        organizations = await prisma.organization.findMany();
      } catch (err: any) {
        logger.dbError(`Failed to list users from Supabase: ${err.message}`);
      }
    }

    if (users.length === 0) {
      users = Array.from(db.users.values());
      organizations = Array.from(db.organizations.values());
    }

    return res.json({ users, organizations });
  }
}
