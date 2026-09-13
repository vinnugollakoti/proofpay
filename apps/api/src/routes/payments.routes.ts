import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller.js';
import { requirePrincipal, requireRole } from '../middleware/auth.js';

export const paymentsRouter = Router();

paymentsRouter.post('/release-intent', requirePrincipal, requireRole('CLIENT'), PaymentsController.createReleaseIntent);
paymentsRouter.post('/verify-and-release', requirePrincipal, requireRole('CLIENT'), PaymentsController.verifyAndRelease);
paymentsRouter.get('/vault-status', PaymentsController.getVaultStatus);
paymentsRouter.get('/:id', PaymentsController.getIntent);
