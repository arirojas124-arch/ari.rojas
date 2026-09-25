import { createHash, randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { accessSecret, refreshSecret, config } from '../../config.js';
import { Company, User } from './auth.models.js';
import { requireAuth, requirePermission } from './auth.middleware.js';
import { permissionsForRole } from './permissions.js';
import { authRateLimit } from './rate-limit.js';
import { Session } from './session.models.js';
import { writeAuditLog } from '../audit/audit.service.js';

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
const refreshSchema = z.object({ refreshToken: z.string().min(20) });

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function issueAccessToken(user: { id: string; tenantId: string; role: string }) {
  return jwt.sign(
    { tenantId: user.tenantId, role: user.role, permissions: permissionsForRole(user.role) },
    accessSecret,
    { subject: user.id, expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

async function issueRefreshToken(user: { id: string; tenantId: string }) {
  const token = jwt.sign(
    { tenantId: user.tenantId, type: 'refresh', jti: randomUUID() },
    refreshSecret,
    { subject: user.id, expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
  await Session.create({
    userId: user.id,
    tenantId: user.tenantId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + config.JWT_REFRESH_DAYS * 24 * 60 * 60 * 1000)
  });
  return token;
}

async function issueSession(user: { id: string; tenantId: string; role: string }) {
  return {
    userId: user.id,
    tenantId: user.tenantId,
    accessToken: issueAccessToken(user),
    refreshToken: await issueRefreshToken(user)
  };
}

router.post('/register', async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const email = input.email.toLowerCase();
    if (await Company.exists({ slug: input.companySlug })) {
      response.status(409).json({ error: { code: 'COMPANY_EXISTS', message: 'Company slug already exists' } });
      return;
    }
    const company = await Company.create({ name: input.companyName, slug: input.companySlug });
    const user = await User.create({
      tenantId: company._id, name: input.name, email,
      passwordHash: await bcrypt.hash(input.password, 12), role: 'company_admin'
    });
    const session = await issueSession({ id: user.id, tenantId: company.id, role: user.role });
    await writeAuditLog({ tenantId: company.id, actorUserId: user.id, action: 'company.registered', resource: 'company', resourceId: company.id });
    response.status(201).json({ data: session });
  } catch (error) { next(error); }
});

router.post('/login', authRateLimit, async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const user = await User.findOne({ tenantId: input.tenantId, email: input.email.toLowerCase(), isActive: true }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      response.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
      return;
    }
    response.json({ data: await issueSession({ id: user.id, tenantId: user.tenantId.toString(), role: user.role }) });
  } catch (error) { next(error); }
});

router.post('/refresh', async (request, response) => {
  try {
    const input = refreshSchema.parse(request.body);
    const payload = jwt.verify(input.refreshToken, refreshSecret);
    if (typeof payload === 'string' || payload.type !== 'refresh' || !payload.sub || typeof payload.tenantId !== 'string') {
      response.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' } });
      return;
    }
    const session = await Session.findOne({
      userId: payload.sub, tenantId: payload.tenantId, tokenHash: hashToken(input.refreshToken),
      revokedAt: { $exists: false }, expiresAt: { $gt: new Date() }
    });
    if (!session) {
      response.status(401).json({ error: { code: 'SESSION_REVOKED', message: 'Refresh session is no longer valid' } });
      return;
    }
    const user = await User.findOne({ _id: payload.sub, tenantId: payload.tenantId, isActive: true });
    if (!user) {
      response.status(401).json({ error: { code: 'USER_INACTIVE', message: 'User is no longer active' } });
      return;
    }
    session.revokedAt = new Date();
    await session.save();
    response.json({ data: await issueSession({ id: user.id, tenantId: user.tenantId.toString(), role: user.role }) });
  } catch {
    response.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' } });
  }
});

router.post('/logout', async (request, response, next) => {
  try {
    const input = refreshSchema.parse(request.body);
    await Session.updateOne({ tokenHash: hashToken(input.refreshToken), revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    response.status(204).send();
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, requirePermission('auth:read'), (request, response) => {
  response.json({ data: request.authUser });
});

export { router as authRouter };
