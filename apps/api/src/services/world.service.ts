import { ethers } from 'ethers';
import { config } from '../config.js';
import { WorldProofPayload } from '../types/index.js';
import { db } from '../db/store.js';
import { logger } from '../utils/logger.js';

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
    const preimage = `proofpay:${jobId}:${paymentIntentId}:${recipientAddress.toLowerCase()}:${amountUsdc}`;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(preimage));
    logger.world(`Generated cryptographic signal binding`, { preimage, signalHash: hash });
    return hash;
  }

  /**
   * Verifies proof with World's official v4 developer endpoint using rp_id or app_id.
   */
  static async verifyProof(
    proofPayload: WorldProofPayload,
    signalHash: string,
    paymentIntentId: string
  ): Promise<{ success: boolean; error?: string; verificationLevel?: string }> {

    const existingNullifier = Array.from(db.verifications.values()).find(
      (v) => v.nullifierHash === proofPayload.nullifier_hash && v.status === 'VALID'
    );
    if (existingNullifier) {
      const errorMsg = `Replay detected: Nullifier ${proofPayload.nullifier_hash.slice(0, 14)}... has already been consumed for another payment.`;
      logger.worldError(errorMsg, {
        consumedInIntentId: existingNullifier.paymentIntentId,
        attemptedInIntentId: paymentIntentId,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    // 2. Mock mode for local testing without active World Developer Portal credentials
    // 2. Simulated failure mode for testing blocked paths
    if (proofPayload.proof === 'FAIL_VERIFICATION_TEST') {
      logger.worldError(`Simulated verification rejection triggered — biometric liveness rejected`);
      return { success: false, error: 'Selfie Check failed: Biometric liveness check rejected.' };
    }

    // Local demo mode is explicit and never used in production configuration.
    // It keeps the demo independent of a live World Portal round-trip.
    if (config.demoMode || config.world.mockVerification) {
      logger.world('Mock verification enabled; recording local demo proof.');
      return { success: true, verificationLevel: proofPayload.credential_type || 'selfie' };
    }

    // 3. Real World Verification API call (v4 endpoint with rp_id)
    try {
      const targetId = config.world.rpId || config.world.appId;
      const url = `${config.world.verifyUrl}/${targetId}`;

      // World v4 protocol 3.0 structure
      const payload = {
        protocol_version: '3.0',
        action: config.world.action,
        nonce: signalHash,
        responses: [
          {
            identifier: proofPayload.credential_type || 'selfie',
            nullifier: proofPayload.nullifier_hash,
            proof: proofPayload.proof,
            merkle_root: proofPayload.merkle_root,
          },
        ],
      };

      logger.world(`Calling World v4 verify endpoint: ${url}`, {
        action: config.world.action,
        nonce: signalHash.slice(0, 16) + '...',
        targetId,
        nullifier: proofPayload.nullifier_hash.slice(0, 16) + '...',
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ProofPay/1.0',
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json().catch(() => ({}));
      logger.world(`World API HTTP Response [${response.status}]:`, data);

      if (response.ok && data.success !== false) {
        logger.world(`World proof verified successfully by developer.world.org!`, {
          action: config.world.action,
        });
        return {
          success: true,
          verificationLevel: proofPayload.credential_type || 'selfie',
        };
      }

      // A local demo can opt in to mock verification. Never turn a failed production
      // verification (including an invalid Merkle root) into a successful payment.
      const errorDetail =
        data.results?.[0]?.detail ||
        data.detail ||
        data.message ||
        `World API returned HTTP ${response.status}`;

      logger.worldError(`World API verification failed [HTTP ${response.status}]: ${errorDetail}`, {
        responseBody: data,
      });

      return {
        success: false,
        error: errorDetail,
      };
    } catch (err: any) {
      logger.worldError(`Network error while calling World verification API: ${err.message}`, err.stack);
      return {
        success: false,
        error: `World API connection error: ${err.message}`,
      };
    }
  }
}
