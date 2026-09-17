import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

export interface RequestTiming {
  dbMs: number;
  dbQueries: number;
  parts: string[];
  totalMs?: number;
  headersApplied: boolean;
}

const timingStore = new AsyncLocalStorage<RequestTiming>();

function createTiming(): RequestTiming {
  return { dbMs: 0, dbQueries: 0, parts: [], headersApplied: false };
}

export function addDbTime(ms: number): void {
  const store = timingStore.getStore();
  if (!store) return;
  store.dbMs += ms;
  store.dbQueries += 1;
}

export function recordPart(label: string, ms: number): void {
  const store = timingStore.getStore();
  if (!store) return;
  store.parts.push(`${label}=${ms.toFixed(1)}ms`);
}

export async function wallTime<T>(label: string, work: Promise<T>): Promise<T> {
  const started = process.hrtime.bigint();
  try {
    return await work;
  } finally {
    recordPart(label, Number(process.hrtime.bigint() - started) / 1e6);
  }
}

export function markPart(label: string): void {
  const store = timingStore.getStore();
  if (!store) return;
  store.parts.push(label);
}

function safePath(req: Request): string {
  return (req.originalUrl ?? req.url ?? '/').split('?')[0] || '/';
}

function applyTimingHeaders(res: Response, started: bigint, store: RequestTiming): void {
  if (store.headersApplied || res.headersSent) return;
  const totalMs = Number(process.hrtime.bigint() - started) / 1e6;
  store.totalMs = totalMs;
  store.headersApplied = true;
  res.setHeader('Server-Timing', `app;dur=${totalMs.toFixed(1)}, db;dur=${store.dbMs.toFixed(1)}`);
  res.setHeader('X-Response-Time', `${totalMs.toFixed(1)}ms`);
  res.setHeader('X-Db-Time', `${store.dbMs.toFixed(1)}ms`);
  res.setHeader('X-Db-Queries', String(store.dbQueries));
  if (store.parts.length) {
    res.setHeader('X-Timing-Parts', store.parts.join(', '));
  }
}

export function requestTiming(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();
  const store = createTiming();

  timingStore.run(store, () => {
    const writeHead = res.writeHead.bind(res);
    res.writeHead = ((...args: unknown[]) => {
      applyTimingHeaders(res, started, store);
      return writeHead(...(args as Parameters<typeof res.writeHead>));
    }) as typeof res.writeHead;

    res.on('finish', () => {
      if (req.method === 'OPTIONS') return;
      const totalMs = store.totalMs ?? Number(process.hrtime.bigint() - started) / 1e6;
      const extra = store.parts.length ? ` ${store.parts.join(' ')}` : '';
      console.log(
        `${req.method} ${safePath(req)} ${res.statusCode} total=${totalMs.toFixed(1)}ms db=${store.dbMs.toFixed(1)}ms queries=${store.dbQueries}${extra}`,
      );
    });

    next();
  });
}
