import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { databaseReady } from './health.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { companiesRouter } from './modules/companies/companies.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean) ?? false, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/companies', companiesRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/audit-logs', auditRouter);
  app.get('/health', (_request, response) => response.json({ status: 'ok', service: 'ari-erp-api', timestamp: new Date().toISOString() }));
  app.get('/ready', (_request, response) => {
    const ready = databaseReady();
    response.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', database: ready ? 'connected' : 'disconnected', timestamp: new Date().toISOString() });
  });
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) { response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.flatten() } }); return; }
    console.error(error);
    response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
  });
  return app;
}