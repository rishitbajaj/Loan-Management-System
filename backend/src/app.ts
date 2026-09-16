import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());

const allowedOrigins = new Set(env.clientOrigins);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      try {
        const { protocol, hostname } = new URL(origin);
        if (protocol === 'https:' && hostname.endsWith('.vercel.app')) {
          callback(null, true);
          return;
        }
      } catch {
        // fall through
      }
      callback(null, false);
    },
    credentials: true,
    maxAge: 86400,
  }),
);
app.use(express.json({ limit: '100kb' }));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
