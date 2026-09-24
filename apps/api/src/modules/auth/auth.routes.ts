import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../../config.js';
import { Company, User } from './auth.models.js';
import { requireAuth, requirePermission } from './auth.middleware.js';
import { permissionsForRole } from './permissions.js';
import { authRateLimit } from './rate-limit.js';

const router = Router();

const registerSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  companySlug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(2).max(80),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(12).max(128)
});

const loginSchema = z.object({
  tenantId: z.string().regex(/^[a-f\d]{24}$/i),
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(128)
});

function issueAccessToken(user: { id: string; tenantId: string; role: string }) {
  return jwt.sign({ tenantId: user.tenantId, role: user.role, permissions: permissionsForRole(user.role) }, config.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

router.post('/register', async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const email = input.email.toLowerCase();
    const existingCompany = await Company.findOne({ slug: input.companySlug }).lean();
    if (existingCompany) {
      response.status(409).json({ error: { code: 'COMPANY_EXISTS', message: 'Company slug already exists' } });
      return;
    }

    const company = await Company.create({ name: input.companyName, slug: input.companySlug });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      tenantId: company._id,
      name: input.name,
      email,
      passwordHash,
      role: 'company_admin'
    });

    response.status(201).json({
      data: { userId: user.id, tenantId: company.id, accessToken: issueAccessToken({ id: user.id, tenantId: company.id, role: user.role }) }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authRateLimit, async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const user = await User.findOne({ tenantId: input.tenantId, email: input.email.toLowerCase(), isActive: true }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      response.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
      return;
    }

    response.json({ data: { userId: user.id, tenantId: user.tenantId.toString(), accessToken: issueAccessToken({ id: user.id, tenantId: user.tenantId.toString(), role: user.role }) } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, requirePermission('auth:read'), (request, response) => {
  response.json({ data: request.authUser });
});

export { router as authRouter };