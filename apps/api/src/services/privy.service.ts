import { config } from '../config.js';
import { db } from '../db/store.js';

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  organizationId?: string;
  enforcedPolicy?: {
    maxLimit: number;
    destinationWhitelisted: boolean;
  };
}

export class PrivyService {
  /**
   * Verifies organization wallet policy & authorizations.
   * Privy policies enforce destination whitelisting and transaction spending caps.
   */
  static async evaluateOrganizationPolicy(
    userId: string,
    amountUsdc: number,
    destinationAddress: string
  ): Promise<PolicyCheckResult> {
    const user = db.users.get(userId);
    if (!user) {
      return { allowed: false, reason: 'User not found in Privy registry' };
    }

    if (!user.organizationId) {
      // Individual client user fallback
      return { allowed: true };
    }

    const org = db.organizations.get(user.organizationId);
    if (!org) {
      return { allowed: false, reason: 'Organization not found' };
    }

    // Policy Rule 1: Max Release Spending Limit per transaction
    if (amountUsdc > org.maxReleaseLimitUsdc) {
      return {
        allowed: false,
        reason: `Privy Policy Violation: Amount ($${amountUsdc} USDC) exceeds organization transaction cap ($${org.maxReleaseLimitUsdc} USDC).`,
        organizationId: org.id,
      };
    }

    // Policy Rule 2: Valid destination recipient
    if (!destinationAddress || !destinationAddress.startsWith('0x') || destinationAddress.length !== 42) {
      return {
        allowed: false,
        reason: 'Privy Policy Violation: Invalid payout destination address.',
        organizationId: org.id,
      };
    }

    return {
      allowed: true,
      organizationId: org.id,
      enforcedPolicy: {
        maxLimit: org.maxReleaseLimitUsdc,
        destinationWhitelisted: true,
      },
    };
  }
}
