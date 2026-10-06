export const rolePermissions: Record<string, string[]> = {
  superadmin: ['auth:read', 'users:read', 'users:write', 'companies:read', 'companies:write', 'customers:read', 'customers:write', 'products:read', 'products:write'],
  company_admin: ['auth:read', 'users:read', 'users:write', 'companies:read', 'companies:write', 'customers:read', 'customers:write', 'products:read', 'products:write'],
  manager: ['auth:read', 'users:read', 'companies:read', 'customers:read', 'customers:write', 'products:read', 'products:write'],
  employee: ['auth:read', 'customers:read', 'customers:write', 'products:read', 'products:write'],
  viewer: ['auth:read', 'customers:read', 'products:read']
};

export function permissionsForRole(role: string) {
  return rolePermissions[role] ?? [];
}