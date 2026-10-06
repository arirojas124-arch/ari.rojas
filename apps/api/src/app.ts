import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { authRouter } from './modules/auth/auth.routes.js';
import { companiesRouter } from './modules/companies/companies.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { isDatabaseConnected } from './database.js';

export function createApp() {
  const app = express();
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  const developmentOrigins = [
  'https://ari-rojas.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006'
];
  const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    }
  }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/companies', companiesRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/customers', customersRouter);
  app.use('/api/v1/products', productsRouter);

  app.get('/health', (_request, response) => {
    response.json({
      status: 'ok',
      service: 'erp-multigestion-api',
      database: isDatabaseConnected() ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString()
    });
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.flatten() } });
      return;
    }

    console.error(error);
    response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
  });

  return app;
}
