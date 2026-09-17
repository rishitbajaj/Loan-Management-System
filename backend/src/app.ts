import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import './config/queryTiming';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestTiming } from './utils/requestTiming';
import { apiRouter } from './routes';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = new Set(env.clientOrigins);

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  exposedHeaders: ['Server-Timing', 'X-Response-Time', 'X-Db-Time', 'X-Db-Queries', 'X-Timing-Parts'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

// CORS first so preflight never waits on later middleware.
app.use(cors(corsOptions));
app.use(requestTiming);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(compression());
app.use(express.json({ limit: '100kb' }));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
