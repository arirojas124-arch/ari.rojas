import { ResourcePage } from './ResourcePage.js';

export function CustomersPage() {
  return <ResourcePage
    title="Clientes"
    description="Administra la información de las personas y empresas a las que vendes."
    endpoint="/customers"
    permission="customers:read"
    fields={[
      { name: 'name', label: 'Nombre o razón social', required: true },
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      { name: 'phone', label: 'Teléfono' },
      { name: 'address', label: 'Dirección', type: 'textarea' }
    ]}
    columns={[
      { key: 'name', label: 'Nombre' },
      { key: 'email', label: 'Correo' },
      { key: 'phone', label: 'Teléfono' }
    ]}
  />;
}
