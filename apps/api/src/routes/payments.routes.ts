import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller.js';

export const paymentsRouter = Router();

paymentsRouter.post('/release-intent', PaymentsController.createReleaseIntent);
paymentsRouter.post('/verify-and-release', PaymentsController.verifyAndRelease);
paymentsRouter.get('/:id', PaymentsController.getIntent);
