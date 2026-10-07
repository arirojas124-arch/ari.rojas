import { ResourcePage } from './ResourcePage.js';

export function SuppliersPage() {
  return <ResourcePage
    title="Proveedores"
    description="Administra los datos de contacto de las empresas y personas que suministran tus productos."
    endpoint="/suppliers"
    permission="suppliers:read"
    fields={[
      { name: 'name', label: 'Nombre o razón social', required: true },
      { name: 'contactName', label: 'Persona de contacto' },
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      { name: 'phone', label: 'Teléfono' },
      { name: 'address', label: 'Dirección', type: 'textarea' }
    ]}
    columns={[
      { key: 'name', label: 'Proveedor' },
      { key: 'contactName', label: 'Contacto' },
      { key: 'email', label: 'Correo' },
      { key: 'phone', label: 'Teléfono' }
    ]}
  />;
}
