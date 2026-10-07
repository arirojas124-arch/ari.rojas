import { ResourcePage } from './ResourcePage.js';

export function WarehousesPage() {
  return <ResourcePage
    title="Almacenes"
    description="Administra las ubicaciones que mantienen existencias independientes por producto."
    endpoint="/warehouses"
    permission="warehouses:read"
    fields={[
      { name: 'name', label: 'Nombre del almacén', required: true },
      { name: 'code', label: 'Código', required: true },
      { name: 'address', label: 'Dirección', type: 'textarea' }
    ]}
    columns={[
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Almacén' },
      { key: 'address', label: 'Dirección' },
      { key: 'isDefault', label: 'Tipo', format: (value) => value ? 'Principal' : 'Adicional' }
    ]}
  />;
}
