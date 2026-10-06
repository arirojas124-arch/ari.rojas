import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTenantIdentifier } from '../src/modules/auth/tenant.js';

test('accepts a Mongo ObjectId as tenant identifier', () => {
  const result = normalizeTenantIdentifier('507f1f77bcf86cd799439011');
  assert.equal(result.kind, 'objectId');
  assert.equal(result?.value.toString(), '507f1f77bcf86cd799439011');
});

test('accepts a company slug as tenant identifier', () => {
  const result = normalizeTenantIdentifier('mi-empresa');
  assert.equal(result.kind, 'slug');
  assert.equal(result.value, 'mi-empresa');
});
