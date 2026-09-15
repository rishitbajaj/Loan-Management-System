import { Router } from 'express';
import * as controller from '../controllers/loan.controller';
import * as payments from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

export const loanRouter = Router();

loanRouter.get('/calculate', controller.calculate);

loanRouter.use(authenticate);

loanRouter.post('/', requireRole('borrower'), controller.create);
loanRouter.get('/me', requireRole('borrower'), controller.listMine);
loanRouter.get('/:id', controller.getById);

loanRouter.patch('/:id/sanction', requireRole('sanction', 'admin'), controller.sanction);
loanRouter.patch('/:id/reject', requireRole('sanction', 'admin'), controller.reject);
loanRouter.patch('/:id/disburse', requireRole('disbursement', 'admin'), controller.disburse);

loanRouter.get('/:id/payments', payments.list);
loanRouter.post('/:id/payments', requireRole('collection', 'admin'), payments.record);
