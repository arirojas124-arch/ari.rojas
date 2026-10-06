import mongoose from 'mongoose';

export type TenantLookup =
  | { kind: 'objectId'; value: mongoose.Types.ObjectId }
  | { kind: 'slug'; value: string };

export function normalizeTenantIdentifier(tenantId: string): TenantLookup | null {
  const trimmed = tenantId.trim();
  if (!trimmed) return null;

  if (/^[a-f\d]{24}$/i.test(trimmed)) {
    return { kind: 'objectId', value: new mongoose.Types.ObjectId(trimmed) };
  }

  return { kind: 'slug', value: trimmed.toLowerCase() };
}
