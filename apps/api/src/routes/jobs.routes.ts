import { Router } from 'express';
import { JobsController } from '../controllers/jobs.controller.js';

export const jobsRouter = Router();

jobsRouter.get('/', JobsController.listJobs);
jobsRouter.get('/:id', JobsController.getJob);
jobsRouter.post('/', JobsController.createJob);
jobsRouter.post('/:id/accept', JobsController.acceptJob);
jobsRouter.post('/:id/fund', JobsController.fundJob);
jobsRouter.post('/:id/submit-work', JobsController.submitWork);
jobsRouter.post('/:id/approve', JobsController.approveWork);
