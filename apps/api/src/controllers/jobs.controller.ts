import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { db } from '../db/store.js';
import { getPrisma } from '../db/prisma.js';
import { Job } from '../types/index.js';
import { AuditService } from '../services/audit.service.js';
import { logger } from '../utils/logger.js';
import { ArcService } from '../services/arc.service.js';

function mapPrismaJob(j: any): Job {
  return {
    id: j.id,
    title: j.title,
    description: j.description || '',
    clientId: j.clientId,
    organizationId: j.organizationId || undefined,
    freelancerId: j.freelancerId || undefined,
    freelancerPayoutAddress: j.freelancerPayoutAddress,
    amountUsdc: Number(j.amountUsdc),
    status: j.status as any,
    escrowId: j.escrowId || undefined,
    submissionUrl: j.submissionUrl || undefined,
    createdAt: j.createdAt instanceof Date ? j.createdAt.toISOString() : j.createdAt,
    updatedAt: j.updatedAt instanceof Date ? j.updatedAt.toISOString() : j.updatedAt,
  };
}

export class JobsController {
  static async listJobs(req: Request, res: Response) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const dbJobs = await prisma.job.findMany({
          orderBy: { createdAt: 'desc' },
        });
        const mapped = dbJobs.map(mapPrismaJob);
        // Sync to in-memory store
        mapped.forEach((j: Job) => db.jobs.set(j.id, j));
        logger.payment(`GET /api/jobs — loaded ${mapped.length} jobs directly from Supabase`);
        return res.json({ jobs: mapped });
      } catch (err: any) {
        logger.dbError(`Failed to fetch jobs from Supabase: ${err.message}`);
      }
    }

    const jobs = Array.from(db.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.json({ jobs });
  }

  static async getJob(req: Request, res: Response) {
    const { id } = req.params;
    const prisma = getPrisma();
    let job: Job | null = null;

    if (prisma) {
      try {
        const dbJob = await prisma.job.findUnique({ where: { id } });
        if (dbJob) {
          job = mapPrismaJob(dbJob);
          db.jobs.set(job.id, job);
        }
      } catch (err: any) {
        logger.dbError(`Failed to fetch job ${id} from Supabase: ${err.message}`);
      }
    }

    if (!job) {
      job = db.jobs.get(id) || null;
    }

    if (!job) {
      logger.paymentError(`GET /api/jobs/${id} — Job not found`);
      return res.status(404).json({ error: `Job with ID "${id}" not found` });
    }

    const timeline = await AuditService.getJobTimeline(job.id);
    return res.json({ job, timeline });
  }

  static async createJob(req: Request, res: Response) {
    const { title, description, amountUsdc, freelancerPayoutAddress } = req.body;
    logger.payment(`Creating job milestone: "${title}" ($${amountUsdc} USDC)`, { freelancerPayoutAddress });

    if (!title || !amountUsdc || !freelancerPayoutAddress) {
      const errorMsg = 'Missing required fields: title, amountUsdc, freelancerPayoutAddress';
      logger.paymentError(`Failed to create job: ${errorMsg}`, req.body);
      return res.status(400).json({ error: errorMsg });
    }

    const prisma = getPrisma();
    let clientUser: any = null;
    let org: any = null;

    if (prisma) {
      try {
        clientUser = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
        if (clientUser?.organizationId) {
          org = await prisma.organization.findUnique({ where: { id: clientUser.organizationId } });
        }
      } catch (err: any) {
        logger.dbError(`Failed to fetch client user from Supabase: ${err.message}`);
      }
    }

    const clientId = req.principal!.userId;
    const authenticatedClient = db.users.get(clientId);
    const organizationId = authenticatedClient?.organizationId || org?.id || 'org-acme-design';

    const jobId = `job-${uuidv4().slice(0, 8)}`;
    const newJob: Job = {
      id: jobId,
      title,
      description: description || '',
      clientId,
      organizationId,
      freelancerPayoutAddress,
      amountUsdc: Number(amountUsdc),
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (prisma) {
      try {
        await prisma.job.create({
          data: {
            id: newJob.id,
            title: newJob.title,
            description: newJob.description,
            clientId,
            organizationId,
            freelancerPayoutAddress,
            amountUsdc: Number(amountUsdc),
            status: 'CREATED',
          },
        });
        logger.db(`Job saved to Supabase: ${newJob.id}`);
      } catch (err: any) {
        logger.dbError(`Failed to insert job into Supabase: ${err.message}`);
      }
    }

    db.jobs.set(newJob.id, newJob);

    await AuditService.recordEvent(
      newJob.id,
      'JOB_CREATED',
      { title, amountUsdc: Number(amountUsdc), freelancerPayoutAddress },
      authenticatedClient?.walletAddress || clientUser?.walletAddress || '0xa11ce00000000000000000000000000000000001',
      'CLIENT'
    );

    return res.status(201).json({ job: newJob });
  }

  static async acceptJob(req: Request, res: Response) {
    const { id } = req.params;
    const prisma = getPrisma();
    let job = db.jobs.get(id);

    if (prisma) {
      try {
        const dbJob = await prisma.job.update({
          where: { id },
          data: { status: 'ACCEPTED', updatedAt: new Date() },
        });
        job = mapPrismaJob(dbJob);
      } catch (err: any) {
        logger.dbError(`Failed to accept job in Supabase: ${err.message}`);
      }
    }

    if (!job) {
      logger.paymentError(`POST /api/jobs/${id}/accept — Job not found`);
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.status !== 'CREATED') return res.status(409).json({ error: 'Only newly created milestones can be accepted.' });

    job.status = 'ACCEPTED';
    job.freelancerId = req.principal!.userId;
    job.updatedAt = new Date().toISOString();
    db.jobs.set(job.id, job);

    await AuditService.recordEvent(
      job.id,
      'JOB_ACCEPTED',
      { payoutAddress: job.freelancerPayoutAddress },
      job.freelancerPayoutAddress,
      'FREELANCER'
    );

    return res.json({ job });
  }

  static async fundJob(req: Request, res: Response) {
    const { id } = req.params;
    const prisma = getPrisma();
    let job = db.jobs.get(id);

    if (prisma) {
      try {
        const dbJob = await prisma.job.findUnique({ where: { id } });
        if (dbJob) job = mapPrismaJob(dbJob);
      } catch (err: any) {
        logger.dbError(`Failed to load job for funding from Supabase: ${err.message}`);
      }
    }

    if (!job) {
      logger.paymentError(`POST /api/jobs/${id}/fund — Job not found`);
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.clientId !== req.principal!.userId) return res.status(403).json({ error: 'Only the milestone client can fund escrow.' });
    if (job.status !== 'CREATED' && job.status !== 'ACCEPTED') return res.status(409).json({ error: 'Escrow can only be funded after a milestone is created or accepted.' });

    const escrowId = job.escrowId || ethers.keccak256(ethers.toUtf8Bytes(`proofpay:escrow:${job.id}`));
    let funding;
    try {
      funding = await ArcService.fundEscrow(escrowId, job.freelancerPayoutAddress, job.amountUsdc);
    } catch (err: any) {
      logger.arcError(`Escrow funding failed for ${job.id}: ${err.message}`);
      return res.status(422).json({
        error: `Escrow was not funded on Arc: ${err.message}`,
        code: 'ESCROW_FUNDING_FAILED',
      });
    }

    job.status = 'FUNDED';
    job.escrowId = escrowId;
    job.updatedAt = new Date().toISOString();
    db.jobs.set(job.id, job);

    if (prisma) {
      try {
        await prisma.job.update({ where: { id: job.id }, data: { status: 'FUNDED', escrowId, updatedAt: new Date() } });
        await prisma.transaction.create({
          data: {
            jobId: job.id,
            txHash: funding.txHash,
            chainId: 5042002,
            action: 'FUND',
            status: 'CONFIRMED',
            blockNumber: BigInt(funding.blockNumber),
          },
        });
      } catch (err: any) {
        logger.dbError(`Arc funding succeeded but persistence failed for ${job.id}: ${err.message}`);
        return res.status(500).json({ error: `Arc escrow was funded (${funding.txHash}), but the database update failed. Do not retry funding; reconcile this transaction first.`, code: 'FUNDING_PERSISTENCE_FAILED', txHash: funding.txHash });
      }
    }

    await AuditService.recordEvent(
      job.id,
      'ESCROW_FUNDED',
      {
        escrowId,
        amountUsdc: job.amountUsdc,
        txHash: funding.txHash,
        explorerUrl: funding.explorerUrl,
        blockNumber: funding.blockNumber,
        funderAddress: funding.funderAddress,
      },
      funding.funderAddress,
      'CLIENT'
    );

    return res.json({ job, funding });
  }

  static async submitWork(req: Request, res: Response) {
    const { id } = req.params;
    const { submissionUrl } = req.body;
    const url = submissionUrl || 'https://github.com/project-deliverable';

    const prisma = getPrisma();
    let job = db.jobs.get(id);

    if (prisma) {
      try {
        const dbJob = await prisma.job.update({
          where: { id },
          data: { status: 'WORK_SUBMITTED', submissionUrl: url, updatedAt: new Date() },
        });
        job = mapPrismaJob(dbJob);
      } catch (err: any) {
        logger.dbError(`Failed to submit work in Supabase: ${err.message}`);
      }
    }

    if (!job) {
      logger.paymentError(`POST /api/jobs/${id}/submit-work — Job not found`);
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.freelancerId && job.freelancerId !== req.principal!.userId) return res.status(403).json({ error: 'Only the assigned freelancer can submit work.' });
    if (job.status !== 'FUNDED' && job.status !== 'ACCEPTED') return res.status(409).json({ error: 'Work can only be submitted for an accepted or funded milestone.' });

    job.status = 'WORK_SUBMITTED';
    job.submissionUrl = url;
    job.updatedAt = new Date().toISOString();
    db.jobs.set(job.id, job);

    await AuditService.recordEvent(
      job.id,
      'WORK_SUBMITTED',
      { submissionUrl: url },
      job.freelancerPayoutAddress,
      'FREELANCER'
    );

    return res.json({ job });
  }

  static async approveWork(req: Request, res: Response) {
    const { id } = req.params;
    const prisma = getPrisma();
    let job = db.jobs.get(id);

    if (prisma) {
      try {
        const dbJob = await prisma.job.update({
          where: { id },
          data: { status: 'APPROVED', updatedAt: new Date() },
        });
        job = mapPrismaJob(dbJob);
      } catch (err: any) {
        logger.dbError(`Failed to approve work in Supabase: ${err.message}`);
      }
    }

    if (!job) {
      logger.paymentError(`POST /api/jobs/${id}/approve — Job not found`);
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.clientId !== req.principal!.userId) return res.status(403).json({ error: 'Only the milestone client can approve work.' });
    if (job.status !== 'WORK_SUBMITTED') return res.status(409).json({ error: 'Only submitted work can be approved.' });

    job.status = 'APPROVED';
    job.updatedAt = new Date().toISOString();
    db.jobs.set(job.id, job);

    await AuditService.recordEvent(
      job.id,
      'WORK_APPROVED',
      { note: 'Work verified by Client. Ready for release.' },
      '0xa11ce00000000000000000000000000000000001',
      'CLIENT'
    );

    return res.json({ job });
  }
}
