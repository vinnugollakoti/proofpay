import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service.js';
import { db } from '../db/store.js';
import { logger } from '../utils/logger.js';

export class AuditController {
  static async getJobTimeline(req: Request, res: Response) {
    const { jobId } = req.params;
    logger.payment(`GET /api/audit/${jobId} — Fetching audit timeline for job`);

    const job = db.jobs.get(jobId);
    if (!job) {
      const errorMsg = `Audit timeline requested for non-existent job ID: "${jobId}"`;
      logger.paymentError(errorMsg);
      return res.status(404).json({
        error: errorMsg,
        code: 'JOB_NOT_FOUND',
      });
    }

    const timeline = AuditService.getJobTimeline(jobId);
    logger.payment(`Audit timeline retrieved for "${job.title}" (${timeline.length} events logged)`);

    return res.json({
      jobId,
      jobTitle: job.title,
      timeline,
    });
  }
}
