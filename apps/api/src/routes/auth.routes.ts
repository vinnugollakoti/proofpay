import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.get('/session', AuthController.getSession);
authRouter.get('/users', AuthController.listUsers);
