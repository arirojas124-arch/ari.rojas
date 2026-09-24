export const rolePermissions: Record<string, string[]> = {
  superadmin: ['auth:read', 'users:read', 'users:write', 'companies:read', 'companies:write'],
  company_admin: ['auth:read', 'users:read', 'users:write', 'companies:read', 'companies:write'],
  manager: ['auth:read', 'users:read', 'companies:read'],
  employee: ['auth:read'],
  viewer: ['auth:read']
};

export function permissionsForRole(role: string) {
  return rolePermissions[role] ?? [];
}