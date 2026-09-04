import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';

export const auditRouter = Router();

auditRouter.get('/:jobId', AuditController.getJobTimeline);
