import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { RiskService } from '../services/risk.service.js';
import { WorldService } from '../services/world.service.js';
import { PrivyService } from '../services/privy.service.js';
import { ArcService } from '../services/arc.service.js';
import { AuditService } from '../services/audit.service.js';
import { PaymentIntent } from '../types/index.js';

export class PaymentsController {
  /**
   * Step 1: Client initiates release intent.
   * Deterministic Risk Engine evaluates risk level.
   * If High Risk -> requires World Selfie Check.
   * Cryptographic signalHash is generated and bound to this payment.
   */
  static async createReleaseIntent(req: Request, res: Response) {
    const { jobId } = req.body;
    const job = db.jobs.get(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'APPROVED' && job.status !== 'FUNDED') {
      return res.status(400).json({ error: `Job not in releasable state. Current status: ${job.status}` });
    }

    const intentId = `pi-${uuidv4().slice(0, 8)}`;
    const recipient = job.freelancerPayoutAddress;
    const amount = job.amountUsdc;

    // Evaluate Deterministic Risk Engine
    const riskDecision = RiskService.evaluateRisk({
      jobId: job.id,
      amountUsdc: amount,
      recipientAddress: recipient,
      clientId: job.clientId,
    });

    // Compute Cryptographic Signal Hash (binds Job + Intent + Recipient + Amount)
    const signalHash = WorldService.generateSignalHash(job.id, intentId, recipient, amount);

    // 60-second authorization TTL
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

    const paymentIntent: PaymentIntent = {
      id: intentId,
      jobId: job.id,
      clientId: job.clientId,
      recipientAddress: recipient,
      amountUsdc: amount,
      riskLevel: riskDecision.riskLevel,
      requiresHumanVerification: riskDecision.requiresHumanVerification,
      signalHash,
      status: 'PENDING',
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    db.paymentIntents.set(intentId, paymentIntent);

    AuditService.recordEvent(
      job.id,
      'PAYMENT_INTENT_CREATED',
      {
        paymentIntentId: intentId,
        riskLevel: riskDecision.riskLevel,
        requiresHumanVerification: riskDecision.requiresHumanVerification,
        reasons: riskDecision.reasons,
        signalHash,
        ttlSeconds: 60,
      },
      '0xa11ce00000000000000000000000000000000001',
      'CLIENT',
      intentId
    );

    return res.json({
      paymentIntent,
      riskDecision,
      signalHash,
    });
  }

  /**
   * Step 2: Client submits World Proof + requests execution.
   * Backend verifies proof against official World API, checks Privy policy, and releases USDC on Arc.
   */
  static async verifyAndRelease(req: Request, res: Response) {
    const { paymentIntentId, worldProof } = req.body;

    const intent = db.paymentIntents.get(paymentIntentId);
    if (!intent) return res.status(404).json({ error: 'Payment intent not found' });

    const job = db.jobs.get(intent.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // 1. Check TTL Expiration
    if (new Date(intent.expiresAt).getTime() < Date.now()) {
      intent.status = 'EXPIRED';
      AuditService.recordEvent(
        job.id,
        'PAYMENT_EXPIRED',
        { paymentIntentId: intent.id, reason: 'Authorization TTL exceeded (60s limit).' },
        undefined,
        'SYSTEM',
        intent.id
      );
      return res.status(400).json({ error: 'Payment authorization expired. Please request release again.' });
    }

    // 2. World ID Verification (if required)
    if (intent.requiresHumanVerification) {
      if (!worldProof || !worldProof.nullifier_hash) {
        intent.status = 'BLOCKED';
        AuditService.recordEvent(
          job.id,
          'PAYMENT_BLOCKED_MISSING_PROOF',
          { reason: 'High-risk payment requires human verification proof.' },
          undefined,
          'SYSTEM',
          intent.id
        );
        return res.status(403).json({
          error: 'Payment blocked: Human verification proof is required.',
          blocked: true,
        });
      }

      AuditService.recordEvent(
        job.id,
        'WORLD_PROOF_SUBMITTED',
        {
          nullifierHash: worldProof.nullifier_hash,
          credentialType: worldProof.credential_type || 'selfie',
        },
        undefined,
        'CLIENT',
        intent.id
      );

      const verificationResult = await WorldService.verifyProof(
        worldProof,
        intent.signalHash,
        intent.id
      );

      if (!verificationResult.success) {
        intent.status = 'BLOCKED';
        AuditService.recordEvent(
          job.id,
          'WORLD_VERIFICATION_FAILED',
          { reason: verificationResult.error },
          undefined,
          'SYSTEM',
          intent.id
        );
        return res.status(403).json({
          error: `Payment blocked: ${verificationResult.error}`,
          blocked: true,
        });
      }

      // Record valid verification
      db.verifications.set(intent.id, {
        id: uuidv4(),
        paymentIntentId: intent.id,
        nullifierHash: worldProof.nullifier_hash,
        merkleRoot: worldProof.merkle_root || '0xroot',
        verificationLevel: verificationResult.verificationLevel || 'selfie',
        verifiedAt: new Date().toISOString(),
        status: 'VALID',
      });

      AuditService.recordEvent(
        job.id,
        'WORLD_PROOF_VERIFIED',
        {
          verificationLevel: verificationResult.verificationLevel,
          nullifierHash: worldProof.nullifier_hash,
        },
        undefined,
        'WORLD',
        intent.id
      );
    }

    // 3. Privy Organization Policy & Authorization
    const policyResult = await PrivyService.evaluateOrganizationPolicy(
      job.clientId,
      job.amountUsdc,
      job.freelancerPayoutAddress
    );

    if (!policyResult.allowed) {
      intent.status = 'BLOCKED';
      AuditService.recordEvent(
        job.id,
        'PRIVY_POLICY_REJECTED',
        { reason: policyResult.reason },
        undefined,
        'PRIVY',
        intent.id
      );
      return res.status(403).json({
        error: `Payment blocked: ${policyResult.reason}`,
        blocked: true,
      });
    }

    AuditService.recordEvent(
      job.id,
      'PRIVY_POLICY_PASSED',
      { policy: policyResult.enforcedPolicy },
      undefined,
      'PRIVY',
      intent.id
    );

    // 4. Arc Escrow Release Execution
    try {
      const arcResult = await ArcService.executeReleaseEscrow(
        job.escrowId || '0xmockEscrowId',
        job.freelancerPayoutAddress,
        job.amountUsdc,
        intent.signalHash
      );

      intent.status = 'EXECUTED';
      job.status = 'COMPLETED';
      job.updatedAt = new Date().toISOString();

      AuditService.recordEvent(
        job.id,
        'ARC_ESCROW_RELEASED',
        {
          txHash: arcResult.txHash,
          explorerUrl: arcResult.explorerUrl,
          amountUsdc: job.amountUsdc,
          recipient: job.freelancerPayoutAddress,
          chainId: 5042002,
        },
        '0xRelayerArcTestnet',
        'ARC',
        intent.id
      );

      return res.json({
        success: true,
        paymentIntent: intent,
        job,
        arc: arcResult,
      });
    } catch (err: any) {
      intent.status = 'BLOCKED';
      AuditService.recordEvent(
        job.id,
        'ARC_RELEASE_FAILED',
        { error: err.message },
        undefined,
        'ARC',
        intent.id
      );
      return res.status(500).json({ error: `Arc execution failed: ${err.message}` });
    }
  }

  static async getIntent(req: Request, res: Response) {
    const intent = db.paymentIntents.get(req.params.id);
    if (!intent) return res.status(404).json({ error: 'Payment intent not found' });
    return res.json({ intent });
  }
}
