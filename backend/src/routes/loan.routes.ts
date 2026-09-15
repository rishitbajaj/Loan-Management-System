import { Router } from 'express';
import * as controller from '../controllers/loan.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

export const loanRouter = Router();

loanRouter.get('/calculate', controller.calculate);

loanRouter.use(authenticate);

loanRouter.post('/', requireRole('borrower'), controller.create);
loanRouter.get('/me', requireRole('borrower'), controller.listMine);
loanRouter.get('/:id', controller.getById);
