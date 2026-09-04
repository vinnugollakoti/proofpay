import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { RiskService } from '../services/risk.service.js';
import { WorldService } from '../services/world.service.js';
import { PrivyService } from '../services/privy.service.js';
import { ArcService } from '../services/arc.service.js';
import { AuditService } from '../services/audit.service.js';
import { PaymentIntent } from '../types/index.js';
import { getPrisma } from '../db/prisma.js';
import { ethers } from 'ethers';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export class PaymentsController {
  /**
   * Step 1: Client initiates release intent.
   * Deterministic Risk Engine evaluates risk level.
   * If High Risk -> requires World Selfie Check.
   * Cryptographic signalHash is generated and bound to this payment.
   */
  static async createReleaseIntent(req: Request, res: Response) {
    const { jobId } = req.body;
    logger.payment(`Creating release intent for job ID: ${jobId}`, { requestBody: req.body });

    const job = db.jobs.get(jobId);
    if (!job) {
      logger.paymentError(`Job not found for release intent: "${jobId}"`);
      return res.status(404).json({ error: `Job with ID "${jobId}" not found` });
    }

    if (job.status !== 'APPROVED' && job.status !== 'FUNDED') {
      logger.paymentError(`Job "${job.title}" is in "${job.status}" state — requires "APPROVED" or "FUNDED" to release`, {
        jobId: job.id,
        currentStatus: job.status,
      });
      return res.status(400).json({
        error: `Job not in releasable state. Current status is "${job.status}", but milestone must be "APPROVED" or "FUNDED".`,
        currentStatus: job.status,
      });
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

    logger.payment(`Deterministic Risk Assessment: ${riskDecision.riskLevel} RISK`, {
      requiresHumanVerification: riskDecision.requiresHumanVerification,
      reasons: riskDecision.reasons,
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

    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.paymentIntent.create({
          data: {
            id: intentId,
            jobId: job.id,
            clientId: job.clientId,
            recipientAddress: recipient,
            amountUsdc: amount,
            riskLevel: riskDecision.riskLevel,
            requiresHumanVerification: riskDecision.requiresHumanVerification,
            signalHash,
            status: 'PENDING',
            expiresAt: new Date(expiresAt),
          },
        });
        logger.db(`Payment intent ${intentId} persisted to Supabase`);
      } catch (err: any) {
        logger.dbError(`Failed to persist payment intent to Supabase: ${err.message}`);
      }
    }

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

    logger.payment(`Release intent registered (${intentId}) — Signal: ${signalHash.slice(0, 18)}... (TTL: 60s)`);

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
    logger.payment(`Verifying payment release for intent: "${paymentIntentId}"`, {
      hasProof: Boolean(worldProof),
      credentialType: worldProof?.credential_type || worldProof?.verification_level,
    });

    const intent = db.paymentIntents.get(paymentIntentId);
    if (!intent) {
      logger.paymentError(`Payment intent "${paymentIntentId}" not found in registry`);
      return res.status(404).json({ error: `Payment intent "${paymentIntentId}" not found` });
    }

    const job = db.jobs.get(intent.jobId);
    if (!job) {
      logger.paymentError(`Associated job "${intent.jobId}" for intent "${intent.id}" not found`);
      return res.status(404).json({ error: `Associated job "${intent.jobId}" not found` });
    }

    // 1. Check TTL Expiration
    const now = Date.now();
    const expiresTimestamp = new Date(intent.expiresAt).getTime();
    if (expiresTimestamp < now) {
      const secondsOver = Math.round((now - expiresTimestamp) / 1000);
      intent.status = 'EXPIRED';
      logger.paymentError(
        `Payment authorization EXPIRED: 60s TTL exceeded by ${secondsOver}s for intent "${intent.id}"`
      );
      AuditService.recordEvent(
        job.id,
        'PAYMENT_EXPIRED',
        { paymentIntentId: intent.id, reason: `Authorization TTL exceeded (${secondsOver}s past expiry).` },
        undefined,
        'SYSTEM',
        intent.id
      );
      return res.status(400).json({
        error: `Payment authorization window expired ${secondsOver}s ago. Please click "Release Payment" again.`,
        code: 'AUTHORIZATION_EXPIRED',
      });
    }

    // 2. World ID Verification (if required)
    if (intent.requiresHumanVerification) {
      if (!worldProof || !worldProof.nullifier_hash) {
        intent.status = 'BLOCKED';
        logger.worldError(`Proof missing for high-risk payment intent "${intent.id}" — payment BLOCKED`);
        AuditService.recordEvent(
          job.id,
          'PAYMENT_BLOCKED_MISSING_PROOF',
          { reason: 'High-risk payment requires human verification proof.' },
          undefined,
          'SYSTEM',
          intent.id
        );
        return res.status(403).json({
          error: 'Payment blocked: High-risk payout requires a verified World Selfie Check.',
          blocked: true,
          code: 'HUMAN_VERIFICATION_REQUIRED',
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

      logger.world(`Submitting proof to World API for verification`, {
        nullifier: worldProof.nullifier_hash?.slice(0, 16) + '...',
        signal: intent.signalHash.slice(0, 16) + '...',
      });

      const verificationResult = await WorldService.verifyProof(
        worldProof,
        intent.signalHash,
        intent.id
      );

      if (!verificationResult.success) {
        intent.status = 'BLOCKED';
        logger.worldError(`World proof rejected: ${verificationResult.error}`, {
          paymentIntentId: intent.id,
          nullifier: worldProof.nullifier_hash,
        });

        AuditService.recordEvent(
          job.id,
          'WORLD_VERIFICATION_FAILED',
          { reason: verificationResult.error },
          undefined,
          'SYSTEM',
          intent.id
        );
        return res.status(403).json({
          error: `Payment blocked by World Verification: ${verificationResult.error}`,
          blocked: true,
          code: 'WORLD_VERIFICATION_FAILED',
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

      logger.world(`Proof successfully verified by World API (Level: ${verificationResult.verificationLevel})`);
    }

    // 3. Privy Organization Policy & Authorization
    logger.privy(`Checking Privy organization policy for client "${job.clientId}"`, {
      amountUsdc: job.amountUsdc,
      recipient: job.freelancerPayoutAddress,
    });

    const policyResult = await PrivyService.evaluateOrganizationPolicy(
      job.clientId,
      job.amountUsdc,
      job.freelancerPayoutAddress
    );

    if (!policyResult.allowed) {
      intent.status = 'BLOCKED';
      logger.privyError(`Privy organization policy rejected payment: ${policyResult.reason}`, {
        clientId: job.clientId,
        amount: job.amountUsdc,
      });

      AuditService.recordEvent(
        job.id,
        'PRIVY_POLICY_REJECTED',
        { reason: policyResult.reason },
        undefined,
        'PRIVY',
        intent.id
      );
      return res.status(403).json({
        error: `Payment blocked by Privy Policy: ${policyResult.reason}`,
        blocked: true,
        code: 'PRIVY_POLICY_VIOLATION',
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

    logger.privy(`Privy organization policy passed`);

    // 4. Protocol Escrow Release Execution
    logger.arc(`Executing settlement release (Escrow: ${job.escrowId || job.id}, Amount: $${job.amountUsdc} USDC)`);

    try {
      const arcResult = await ArcService.executeReleaseEscrow(
        job.escrowId || `escrow_${job.id}`,
        job.freelancerPayoutAddress,
        job.amountUsdc,
        intent.signalHash
      );

      intent.status = 'EXECUTED';
      job.status = 'COMPLETED';
      job.updatedAt = new Date().toISOString();

      const prisma = getPrisma();
      if (prisma) {
        try {
          await prisma.job.update({
            where: { id: job.id },
            data: { status: 'COMPLETED', updatedAt: new Date() },
          });
          logger.db(`Job ${job.id} marked COMPLETED in Supabase`);
          await prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: 'EXECUTED' },
          });
        } catch (err: any) {
          logger.dbError(`Failed to update job/intent status to COMPLETED in Supabase: ${err.message}`);
        }
      }

      AuditService.recordEvent(
        job.id,
        'ESCROW_RELEASED',
        {
          settlementStatus: arcResult.status,
          settlementMode: arcResult.mode,
          amountUsdc: job.amountUsdc,
          recipient: job.freelancerPayoutAddress,
          txHash: arcResult.txHash || undefined,
          explorerUrl: arcResult.explorerUrl || undefined,
        },
        'ProofPay Settlement Protocol',
        'CLIENT',
        intent.id
      );

      logger.payment(`SUCCESS: Payment released to ${job.freelancerPayoutAddress}`, {
        amountUsdc: job.amountUsdc,
        status: arcResult.status,
        mode: arcResult.mode,
      });

      return res.json({
        success: true,
        paymentIntent: intent,
        job,
        arc: arcResult,
      });
    } catch (err: any) {
      intent.status = 'BLOCKED';
      logger.arcError(`Release execution failed: ${err.message}`, err.stack);

      AuditService.recordEvent(
        job.id,
        'RELEASE_FAILED',
        { error: err.message },
        undefined,
        'CLIENT',
        intent.id
      );
      return res.status(500).json({
        error: `Settlement failed: ${err.message}`,
        code: 'SETTLEMENT_EXECUTION_FAILED',
      });
    }
  }

  static async getIntent(req: Request, res: Response) {
    const intent = db.paymentIntents.get(req.params.id);
    if (!intent) {
      logger.paymentError(`Payment intent "${req.params.id}" not found`);
      return res.status(404).json({ error: 'Payment intent not found' });
    }
    return res.json({ intent });
  }

  static async getVaultStatus(req: Request, res: Response) {
    try {
      const provider = new ethers.JsonRpcProvider(config.arc.rpcUrl);
      const address = config.arc.relayerPrivateKey
        ? new ethers.Wallet(config.arc.relayerPrivateKey).address
        : '0x37Da1f17986e4DC6d4E8D86713791698F07c8099';

      const ethBal = await provider.getBalance(address);
      const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
      const usdc = new ethers.Contract(config.arc.usdcAddress, erc20Abi, provider);
      const usdcBal = await usdc.balanceOf(address);

      return res.json({
        success: true,
        chainId: config.arc.chainId,
        escrowContractAddress: config.arc.escrowAddress,
        vaultAddress: address,
        gasBalance: ethers.formatEther(ethBal),
        usdcBalance: ethers.formatUnits(usdcBal, 6),
        explorerUrl: config.arc.explorerUrl,
        privyOrgId: config.privy.orgId,
        privyAppId: config.privy.appId,
        status: 'ONLINE',
      });
    } catch (err: any) {
      logger.arcError(`Failed to fetch vault status: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  }
}
