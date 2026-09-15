import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', controller.register);
authRouter.post('/login', controller.login);
authRouter.get('/me', authenticate, controller.me);
