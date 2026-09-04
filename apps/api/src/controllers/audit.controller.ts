import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service.js';

export class AuditController {
  static async getJobTimeline(req: Request, res: Response) {
    const timeline = AuditService.getJobTimeline(req.params.jobId);
    return res.json({ timeline });
  }
}
