import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createHmac, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../../config.js';
import { Company, RefreshSession, User } from './auth.models.js';
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

const refreshSchema = z.object({ refreshToken: z.string().min(1) }).strict();
const refreshSecret = createHmac('sha256', config.JWT_ACCESS_SECRET).update('ari-erp-refresh-token-v1').digest('hex');
const refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000;

function normalizeTenantLookup(tenantId: string) {
  const trimmed = tenantId.trim();
  if (!trimmed) return null;

  if (/^[a-f\d]{24}$/i.test(trimmed)) {
    return { kind: 'objectId' as const, value: new mongoose.Types.ObjectId(trimmed) };
  }

  return { kind: 'slug' as const, value: trimmed.toLowerCase() };
}

async function issueTokenPair(user: { id: string; tenantId: string; role: string }) {
  const tokenId = randomUUID();
  const expiresAt = new Date(Date.now() + refreshLifetimeMs);
  const accessToken = jwt.sign(
    { tenantId: user.tenantId, role: user.role, permissions: permissionsForRole(user.role) },
    config.JWT_ACCESS_SECRET,
    { subject: user.id, expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
  const refreshToken = jwt.sign(
    { tenantId: user.tenantId, tokenId },
    refreshSecret,
    { subject: user.id, expiresIn: '30d' }
  );

  await RefreshSession.create({ tokenId, userId: user.id, tenantId: user.tenantId, expiresAt });
  return { userId: user.id, tenantId: user.tenantId, accessToken, refreshToken };
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
      data: await issueTokenPair({ id: user.id, tenantId: company.id, role: user.role })
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

    response.json({
      data: await issueTokenPair({ id: user.id, tenantId: user.tenantId.toString(), role: user.role })
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (request, response, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(request.body);
    let payload: jwt.JwtPayload;
    try {
      const verified = jwt.verify(refreshToken, refreshSecret);
      if (
        typeof verified === 'string'
        || typeof verified.sub !== 'string'
        || typeof verified.tenantId !== 'string'
        || typeof verified.tokenId !== 'string'
      ) {
        throw new Error('Invalid refresh token claims');
      }
      payload = verified;
    } catch {
      response.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Session expired. Sign in again.' } });
      return;
    }

    const storedSession = await RefreshSession.findOneAndDelete({
      tokenId: payload.tokenId,
      userId: payload.sub,
      tenantId: payload.tenantId,
      expiresAt: { $gt: new Date() }
    });
    if (!storedSession) {
      response.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Session expired. Sign in again.' } });
      return;
    }

    const [user, company] = await Promise.all([
      User.findOne({ _id: payload.sub, tenantId: payload.tenantId, isActive: true }),
      Company.findOne({ _id: payload.tenantId, isActive: true })
    ]);
    if (!user || !company) {
      response.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Session expired. Sign in again.' } });
      return;
    }

    response.json({
      data: await issueTokenPair({ id: user.id, tenantId: user.tenantId.toString(), role: user.role })
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, requirePermission('auth:read'), (request, response) => {
  response.json({ data: request.authUser });
});

export { router as authRouter };