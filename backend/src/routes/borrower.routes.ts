import { Router } from 'express';
import * as controller from '../controllers/borrower.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { salarySlipUpload } from '../middleware/upload';

export const borrowerRouter = Router();

borrowerRouter.use(authenticate, requireRole('borrower'));

borrowerRouter.put('/profile', controller.updateProfile);
borrowerRouter.post('/salary-slip', salarySlipUpload, controller.uploadSalarySlip);
borrowerRouter.get('/salary-slip', controller.downloadSalarySlip);
