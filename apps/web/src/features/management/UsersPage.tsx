import { ResourcePage } from './ResourcePage.js';

const roleNames: Record<string, string> = {
  company_admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Empleado',
  viewer: 'Solo lectura'
};

export function UsersPage() {
  return <ResourcePage
    title="Usuarios"
    description="Crea cuentas de acceso para las personas que trabajan en tu empresa."
    endpoint="/users"
    permission="users:read"
    fields={[
      { name: 'name', label: 'Nombre completo', required: true },
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
      { name: 'password', label: 'Contraseña temporal', type: 'password', required: true, minLength: 12, createOnly: true },
      { name: 'role', label: 'Rol', type: 'select', required: true, options: [
        { label: 'Empleado', value: 'employee' },
        { label: 'Gerente', value: 'manager' },
        { label: 'Solo lectura', value: 'viewer' },
        { label: 'Administrador', value: 'company_admin' }
      ] }
    ]}
    columns={[
      { key: 'name', label: 'Nombre' },
      { key: 'email', label: 'Correo' },
      { key: 'role', label: 'Rol', format: (value) => roleNames[String(value)] ?? String(value ?? '—') }
    ]}
  />;
}
