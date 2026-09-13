import { Router } from 'express';
import { JobsController } from '../controllers/jobs.controller.js';
import { requirePrincipal, requireRole } from '../middleware/auth.js';

export const jobsRouter = Router();

jobsRouter.get('/', JobsController.listJobs);
jobsRouter.get('/:id', JobsController.getJob);
jobsRouter.post('/', requirePrincipal, requireRole('CLIENT'), JobsController.createJob);
jobsRouter.post('/:id/accept', requirePrincipal, requireRole('FREELANCER'), JobsController.acceptJob);
jobsRouter.post('/:id/fund', requirePrincipal, requireRole('CLIENT'), JobsController.fundJob);
jobsRouter.post('/:id/submit-work', requirePrincipal, requireRole('FREELANCER'), JobsController.submitWork);
jobsRouter.post('/:id/approve', requirePrincipal, requireRole('CLIENT'), JobsController.approveWork);
