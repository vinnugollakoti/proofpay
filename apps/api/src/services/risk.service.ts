import { RiskDecision } from '../types/index.js';
import { db } from '../db/store.js';

export interface RiskInput {
  jobId: string;
  amountUsdc: number;
  recipientAddress: string;
  clientId: string;
}

export class RiskService {
  private static HIGH_AMOUNT_THRESHOLD = 500; // >= $500 triggers verification
  private static VELOCITY_THRESHOLD_HOURLY = 3;

  static evaluateRisk(input: RiskInput): RiskDecision {
    const reasons: string[] = [];
    let isHighRisk = false;

    // Rule 1: High Transaction Value
    if (input.amountUsdc >= this.HIGH_AMOUNT_THRESHOLD) {
      isHighRisk = true;
      reasons.push(
        `High Value Payout: Amount ($${input.amountUsdc} USDC) meets or exceeds risk threshold ($${this.HIGH_AMOUNT_THRESHOLD} USDC).`
      );
    }

    // Rule 2: First-time Recipient check
    const pastCompletedJobs = Array.from(db.jobs.values()).filter(
      (j) =>
        j.clientId === input.clientId &&
        j.freelancerPayoutAddress.toLowerCase() === input.recipientAddress.toLowerCase() &&
        j.status === 'COMPLETED'
    );
    if (pastCompletedJobs.length === 0) {
      isHighRisk = true;
      reasons.push(
        `First-Time Recipient: Client has no prior completed payments to ${input.recipientAddress.slice(0, 8)}...`
      );
    }

    // Rule 3: Velocity Check (payments requested in past hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const recentIntents = Array.from(db.paymentIntents.values()).filter(
      (pi) => pi.clientId === input.clientId && pi.createdAt > oneHourAgo
    );
    if (recentIntents.length >= this.VELOCITY_THRESHOLD_HOURLY) {
      isHighRisk = true;
      reasons.push(
        `Unusual Velocity: Client has initiated ${recentIntents.length} payouts in the last 60 minutes.`
      );
    }

    if (isHighRisk) {
      return {
        riskLevel: 'HIGH',
        requiresHumanVerification: true,
        reasons,
      };
    }

    return {
      riskLevel: 'LOW',
      requiresHumanVerification: false,
      reasons: ['Standard low-risk payout below verification thresholds.'],
    };
  }
}
