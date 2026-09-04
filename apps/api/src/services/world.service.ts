import { ethers } from 'ethers';
import { config } from '../config.js';
import { WorldProofPayload } from '../types/index.js';
import { db } from '../db/store.js';

export class WorldService {
  /**
   * Cryptographically binds the verification context to the specific payment parameters.
   * If recipient, amount, or paymentIntentId changes, the signal changes and proof becomes invalid.
   */
  static generateSignalHash(
    jobId: string,
    paymentIntentId: string,
    recipientAddress: string,
    amountUsdc: number
  ): string {
    return ethers.keccak256(
      ethers.toUtf8Bytes(
        `proofpay:${jobId}:${paymentIntentId}:${recipientAddress.toLowerCase()}:${amountUsdc}`
      )
    );
  }

  /**
   * Verifies proof with World's official v4 developer endpoint.
   */
  static async verifyProof(
    proofPayload: WorldProofPayload,
    signalHash: string,
    paymentIntentId: string
  ): Promise<{ success: boolean; error?: string; verificationLevel?: string }> {
    // 1. Anti-Replay Check: Ensure nullifier hasn't been used before
    const existingNullifier = Array.from(db.verifications.values()).find(
      (v) => v.nullifierHash === proofPayload.nullifier_hash && v.status === 'VALID'
    );
    if (existingNullifier) {
      return {
        success: false,
        error: `Replay detected: Nullifier ${proofPayload.nullifier_hash.slice(0, 10)}... has already been consumed for another payment.`,
      };
    }

    // 2. Mock mode for local testing without active World Developer Portal credentials
    if (config.world.mockVerification || config.world.appId.includes('staging_proofpay_demo')) {
      if (proofPayload.proof === 'FAIL_VERIFICATION_TEST') {
        return { success: false, error: 'Selfie Check failed: Liveness test rejected.' };
      }
      return {
        success: true,
        verificationLevel: proofPayload.credential_type || 'selfie',
      };
    }

    // 3. Real World Verification API call (v4 endpoint)
    try {
      const url = `${config.world.verifyUrl}/${config.world.appId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...proofPayload,
          action: config.world.action,
          signal: signalHash,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.detail || data.message || 'World proof verification rejected by official endpoint.',
        };
      }

      return {
        success: true,
        verificationLevel: data.verification_level || 'selfie',
      };
    } catch (err: any) {
      return {
        success: false,
        error: `World API connection error: ${err.message}`,
      };
    }
  }
}
