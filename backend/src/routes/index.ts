import { Router } from 'express';
import { authRouter } from './auth.routes';
import { borrowerRouter } from './borrower.routes';
import { dashboardRouter } from './dashboard.routes';
import { loanRouter } from './loan.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/borrower', borrowerRouter);
apiRouter.use('/loans', loanRouter);
apiRouter.use('/dashboard', dashboardRouter);
