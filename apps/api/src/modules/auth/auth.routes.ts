import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from '../../config.js';
import { Company, User } from './auth.models.js';
import { requireAuth, requirePermission } from './auth.middleware.js';
import { permissionsForRole } from './permissions.js';
import { authRateLimit } from './rate-limit.js';
import { requireDatabase } from '../../database.js';

const router = Router();
router.use(requireDatabase);

const registerSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  companySlug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(2).max(80),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(12).max(128)
});

const loginSchema = z.object({
  tenantId: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(128)
});

function normalizeTenantLookup(tenantId: string) {
  const trimmed = tenantId.trim();
  if (!trimmed) return null;

  if (/^[a-f\d]{24}$/i.test(trimmed)) {
    return { kind: 'objectId' as const, value: new mongoose.Types.ObjectId(trimmed) };
  }

  return { kind: 'slug' as const, value: trimmed.toLowerCase() };
}

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
    const tenantLookup = normalizeTenantLookup(input.tenantId);

    if (!tenantLookup) {
      response.status(400).json({ error: { code: 'INVALID_TENANT', message: 'Tenant identifier is required' } });
      return;
    }

    const tenantQuery = tenantLookup.kind === 'objectId'
      ? { _id: tenantLookup.value }
      : { slug: tenantLookup.value };

    const company = await Company.findOne({ ...tenantQuery, isActive: true }).lean();
    if (!company) {
      response.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
      return;
    }

    const user = await User.findOne({ tenantId: company._id, email: input.email.toLowerCase(), isActive: true }).select('+passwordHash');
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