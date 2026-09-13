import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requirePrincipal } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', AuthController.login);
authRouter.post('/privy/session', requirePrincipal, AuthController.syncPrivySession);
authRouter.get('/session', AuthController.getSession);
authRouter.get('/users', AuthController.listUsers);
