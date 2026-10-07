import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { authRouter } from './modules/auth/auth.routes.js';
import { companiesRouter } from './modules/companies/companies.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { salesRouter } from './modules/sales/sales.routes.js';
import { invoicesRouter } from './modules/invoices/invoices.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { suppliersRouter } from './modules/suppliers/suppliers.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { warehousesRouter } from './modules/warehouses/warehouses.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { quotesRouter } from './modules/quotes/quotes.routes.js';
import { purchaseRequestsRouter } from './modules/purchases/purchase-requests.routes.js';
import { purchaseOrdersRouter, receiptsRouter } from './modules/purchases/purchases.routes.js';
import { financeRouter } from './modules/finance/finance.routes.js';
import { departmentsRouter } from './modules/people/departments.routes.js';
import { employeesRouter } from './modules/people/employees.routes.js';
import { attendanceRouter } from './modules/people/attendance.routes.js';
import { projectsRouter, tasksRouter } from './modules/projects/projects.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { auditWriteRequests } from './modules/audit/audit.middleware.js';
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

  app.use('/api/v1', auditWriteRequests);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/companies', companiesRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/customers', customersRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/sales', salesRouter);
  app.use('/api/v1/invoices', invoicesRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/suppliers', suppliersRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/warehouses', warehousesRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/quotes', quotesRouter);
  app.use('/api/v1/purchase-requests', purchaseRequestsRouter);
  app.use('/api/v1/purchases', purchaseOrdersRouter);
  app.use('/api/v1/receipts', receiptsRouter);
  app.use('/api/v1/finance', financeRouter);
  app.use('/api/v1/departments', departmentsRouter);
  app.use('/api/v1/employees', employeesRouter);
  app.use('/api/v1/attendance', attendanceRouter);
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/audit', auditRouter);

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
