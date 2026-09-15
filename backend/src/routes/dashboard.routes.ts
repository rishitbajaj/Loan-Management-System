import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/sales/leads', requireRole('sales', 'admin'), controller.salesLeads);
dashboardRouter.get('/sanction/loans', requireRole('sanction', 'admin'), controller.sanctionQueue);
dashboardRouter.get('/disbursement/loans', requireRole('disbursement', 'admin'), controller.disbursementQueue);
dashboardRouter.get('/collection/loans', requireRole('collection', 'admin'), controller.collectionQueue);
dashboardRouter.get('/summary', requireRole('admin'), controller.summary);
