export type ModuleItem = { label: string; path?: string; available: boolean; permission?: string };
export type ModuleGroup = { label?: string; items: ModuleItem[] };

export const moduleGroups: ModuleGroup[] = [
  { items: [{ label: 'Dashboard', path: '/dashboard', available: true }] },
  { label: 'Comercial', items: [
    { label: 'Clientes', path: '/customers', available: true, permission: 'customers:read' },
    { label: 'Cotizaciones', path: '/quotes', available: true, permission: 'quotes:read' },
    { label: 'Ventas', path: '/sales', available: true, permission: 'sales:read' },
    { label: 'Facturas', path: '/invoices', available: true, permission: 'invoices:read' }
  ] },
  { label: 'Inventario', items: [
    { label: 'Productos', path: '/products', available: true, permission: 'products:read' },
    { label: 'Categorías', path: '/categories', available: true, permission: 'categories:read' },
    { label: 'Almacenes', path: '/warehouses', available: true, permission: 'warehouses:read' },
    { label: 'Existencias', path: '/inventory', available: true, permission: 'inventory:read' },
    { label: 'Movimientos', path: '/inventory/movements', available: true, permission: 'inventory:read' }
  ] },
  { label: 'Compras', items: [
    { label: 'Proveedores', path: '/suppliers', available: true, permission: 'suppliers:read' },
    { label: 'Solicitudes', path: '/purchase-requests', available: true, permission: 'purchases:read' },
    { label: 'Órdenes de compra', path: '/purchases', available: true, permission: 'purchases:read' },
    { label: 'Recepciones', path: '/receipts', available: true, permission: 'purchases:read' }
  ] },
  { label: 'Finanzas', items: [
    { label: 'Ingresos y gastos', path: '/finance', available: true, permission: 'finance:read' },
    { label: 'Cuentas por cobrar', path: '/receivables', available: true, permission: 'finance:read' },
    { label: 'Cuentas por pagar', path: '/payables', available: true, permission: 'finance:read' }
  ] },
  { label: 'Personas', items: [
    { label: 'Empleados', path: '/employees', available: true, permission: 'employees:read' },
    { label: 'Asistencia y permisos', path: '/attendance', available: true, permission: 'attendance:read' },
    { label: 'Departamentos', path: '/departments', available: true, permission: 'departments:read' }
  ] },
  { label: 'Proyectos', items: [
    { label: 'Proyectos y tareas', path: '/projects', available: true, permission: 'projects:read' },
    { label: 'Seguimiento', path: '/tasks', available: true, permission: 'projects:read' }
  ] },
  { items: [{ label: 'Reportes', path: '/reports', available: true, permission: 'reports:read' }] },
  { label: 'Configuración', items: [
    { label: 'Empresa', path: '/settings/company', available: true, permission: 'companies:read' },
    { label: 'Usuarios y roles', path: '/settings/users', available: true, permission: 'users:read' },
    { label: 'Auditoría', path: '/settings/audit', available: true, permission: 'audit:read' }
  ] }
];
