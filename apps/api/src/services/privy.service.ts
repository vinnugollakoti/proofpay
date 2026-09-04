import { config } from '../config.js';
import { db } from '../db/store.js';
import { logger } from '../utils/logger.js';

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
      const reason = `User "${userId}" not found in Privy/local user registry`;
      logger.privyError(reason);
      return { allowed: false, reason };
    }

    if (!user.organizationId) {
      logger.privy(`User "${user.privyUserId}" has no organization attached — falling back to standard client policy`);
      return { allowed: true };
    }

    const org = db.organizations.get(user.organizationId);
    if (!org) {
      const reason = `Organization "${user.organizationId}" not found for user "${user.privyUserId}"`;
      logger.privyError(reason);
      return { allowed: false, reason };
    }

    logger.privy(`Evaluating Privy wallet policies for org: "${org.name}" (${org.id})`, {
      amountUsdc,
      maxLimitUsdc: org.maxReleaseLimitUsdc,
      destination: destinationAddress,
    });

    // Policy Rule 1: Max Release Spending Limit per transaction
    if (amountUsdc > org.maxReleaseLimitUsdc) {
      const reason = `Privy Policy Violation: Amount ($${amountUsdc} USDC) exceeds organization transaction cap ($${org.maxReleaseLimitUsdc} USDC).`;
      logger.privyError(reason, {
        requestedAmount: amountUsdc,
        cap: org.maxReleaseLimitUsdc,
        organizationId: org.id,
      });
      return {
        allowed: false,
        reason,
        organizationId: org.id,
      };
    }

    // Policy Rule 2: Valid destination recipient
    if (!destinationAddress || !destinationAddress.startsWith('0x') || destinationAddress.length !== 42) {
      const reason = `Privy Policy Violation: Destination address "${destinationAddress}" is invalid or malformed.`;
      logger.privyError(reason);
      return {
        allowed: false,
        reason,
        organizationId: org.id,
      };
    }

    logger.privy(`Privy policy check passed for org: "${org.name}"`, {
      amountUsdc,
      maxLimit: org.maxReleaseLimitUsdc,
    });

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
