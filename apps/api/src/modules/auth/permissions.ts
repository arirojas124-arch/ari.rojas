export const rolePermissions: Record<string, string[]> = {
  superadmin: ['auth:read', 'users:read', 'users:write', 'companies:read', 'companies:write', 'customers:read', 'customers:write', 'products:read', 'products:write', 'sales:read', 'sales:write', 'invoices:read', 'invoices:write', 'reports:read'],
  company_admin: ['auth:read', 'users:read', 'users:write', 'companies:read', 'companies:write', 'customers:read', 'customers:write', 'products:read', 'products:write', 'sales:read', 'sales:write', 'invoices:read', 'invoices:write', 'reports:read'],
  manager: ['auth:read', 'users:read', 'companies:read', 'customers:read', 'customers:write', 'products:read', 'products:write', 'sales:read', 'sales:write', 'invoices:read', 'invoices:write', 'reports:read'],
  employee: ['auth:read', 'customers:read', 'customers:write', 'products:read', 'products:write', 'sales:read', 'sales:write', 'invoices:read', 'reports:read'],
  viewer: ['auth:read', 'customers:read', 'products:read', 'sales:read', 'invoices:read', 'reports:read']
};

export function permissionsForRole(role: string) {
  return rolePermissions[role] ?? [];
}