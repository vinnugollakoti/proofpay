import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { db } from '../db/store.js';
import { Job } from '../types/index.js';
import { AuditService } from '../services/audit.service.js';
import { logger } from '../utils/logger.js';

export class JobsController {
  static async listJobs(req: Request, res: Response) {
    const jobs = Array.from(db.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.json({ jobs });
  }

  static async getJob(req: Request, res: Response) {
    const job = db.jobs.get(req.params.id);
    if (!job) {
      logger.paymentError(`GET /api/jobs/${req.params.id} — Job not found`);
      return res.status(404).json({ error: `Job with ID "${req.params.id}" not found` });
    }
    const timeline = AuditService.getJobTimeline(job.id);
    return res.json({ job, timeline });
  }

  static async createJob(req: Request, res: Response) {
    const { title, description, amountUsdc, freelancerPayoutAddress } = req.body;
    logger.payment(`Creating job milestone: "${title}" ($${amountUsdc} USDC)`, {
      freelancerPayoutAddress,
    });

    if (!title || !amountUsdc || !freelancerPayoutAddress) {
      const errorMsg = 'Missing required fields: title, amountUsdc, freelancerPayoutAddress';
      logger.paymentError(`Failed to create job: ${errorMsg}`, req.body);
      return res.status(400).json({ error: errorMsg });
    }

    const client = Array.from(db.users.values()).find((u) => u.role === 'CLIENT');
    const clientId = client?.id || 'user-client-alice';

    const newJob: Job = {
      id: `job-${uuidv4().slice(0, 8)}`,
      title,
      description: description || '',
      clientId,
      organizationId: client?.organizationId,
      freelancerPayoutAddress,
      amountUsdc: Number(amountUsdc),
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.jobs.set(newJob.id, newJob);

    AuditService.recordEvent(
      newJob.id,
      'JOB_CREATED',
      { title, amountUsdc: Number(amountUsdc), freelancerPayoutAddress },
      client?.walletAddress,
      'CLIENT'
    );

    logger.payment(`Job created successfully (${newJob.id}): "${newJob.title}"`);
    return res.status(201).json({ job: newJob });
  }

  static async acceptJob(req: Request, res: Response) {
    const job = db.jobs.get(req.params.id);
    if (!job) {
      logger.paymentError(`POST /api/jobs/${req.params.id}/accept — Job not found`);
      return res.status(404).json({ error: 'Job not found' });
    }

    job.status = 'ACCEPTED';
    job.updatedAt = new Date().toISOString();

    AuditService.recordEvent(
      job.id,
      'JOB_ACCEPTED',
      { payoutAddress: job.freelancerPayoutAddress },
      job.freelancerPayoutAddress,
      'FREELANCER'
    );

    logger.payment(`Job "${job.title}" accepted by freelancer (${job.freelancerPayoutAddress})`);
    return res.json({ job });
  }

  static async fundJob(req: Request, res: Response) {
    const job = db.jobs.get(req.params.id);
    if (!job) {
      logger.paymentError(`POST /api/jobs/${req.params.id}/fund — Job not found`);
      return res.status(404).json({ error: 'Job not found' });
    }

    const { txHash } = req.body;
    job.status = 'FUNDED';
    job.escrowId = ethers.keccak256(ethers.toUtf8Bytes(`escrow:${job.id}:${Date.now()}`));
    job.updatedAt = new Date().toISOString();

    AuditService.recordEvent(
      job.id,
      'ESCROW_FUNDED',
      {
        escrowId: job.escrowId,
        amountUsdc: job.amountUsdc,
        chain: 'Arc Testnet (5042002)',
        txHash: txHash || '0xmockArcFundTransactionHash',
      },
      '0xa11ce00000000000000000000000000000000001',
      'CLIENT'
    );

    logger.arc(`Escrow funded on Arc for job "${job.title}": $${job.amountUsdc} USDC (Escrow: ${job.escrowId.slice(0, 16)}...)`);
    return res.json({ job });
  }

  static async submitWork(req: Request, res: Response) {
    const job = db.jobs.get(req.params.id);
    if (!job) {
      logger.paymentError(`POST /api/jobs/${req.params.id}/submit-work — Job not found`);
      return res.status(404).json({ error: 'Job not found' });
    }

    const { submissionUrl } = req.body;
    job.status = 'WORK_SUBMITTED';
    job.submissionUrl = submissionUrl || 'https://github.com/project-deliverable';
    job.updatedAt = new Date().toISOString();

    AuditService.recordEvent(
      job.id,
      'WORK_SUBMITTED',
      { submissionUrl: job.submissionUrl },
      job.freelancerPayoutAddress,
      'FREELANCER'
    );

    logger.payment(`Work submitted for job "${job.title}": ${job.submissionUrl}`);
    return res.json({ job });
  }

  static async approveWork(req: Request, res: Response) {
    const job = db.jobs.get(req.params.id);
    if (!job) {
      logger.paymentError(`POST /api/jobs/${req.params.id}/approve — Job not found`);
      return res.status(404).json({ error: 'Job not found' });
    }

    job.status = 'APPROVED';
    job.updatedAt = new Date().toISOString();

    AuditService.recordEvent(
      job.id,
      'WORK_APPROVED',
      { note: 'Work verified by Client. Ready for release.' },
      '0xa11ce00000000000000000000000000000000001',
      'CLIENT'
    );

    logger.payment(`Work approved for job "${job.title}" — ready for payment release`);
    return res.json({ job });
  }
}
