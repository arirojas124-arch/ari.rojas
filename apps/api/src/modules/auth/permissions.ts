export const roles = ['superadmin', 'company_admin', 'manager', 'employee', 'viewer'] as const;
export type Role = typeof roles[number];

export const rolePermissions: Record<Role, string[]> = {
  superadmin: ['auth:read', 'users:read', 'users:write', 'companies:read', 'companies:write', 'audit:read'],
  company_admin: ['auth:read', 'users:read', 'users:write', 'companies:read', 'companies:write', 'audit:read'],
  manager: ['auth:read', 'users:read', 'users:write', 'companies:read', 'audit:read'],
  employee: ['auth:read'],
  viewer: ['auth:read']
};

const assignableRoles: Record<Role, Role[]> = {
  superadmin: [...roles],
  company_admin: ['company_admin', 'manager', 'employee', 'viewer'],
  manager: ['employee', 'viewer'],
  employee: [],
  viewer: []
};

export function permissionsForRole(role: string) {
  return rolePermissions[role as Role] ?? [];
}

export function canAssignRole(actorRole: string, targetRole: string) {
  const allowed = assignableRoles[actorRole as Role] ?? [];
  return allowed.includes(targetRole as Role);
}
