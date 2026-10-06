import { ResourcePage } from './ResourcePage.js';

const formatPrice = (value: unknown) => new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value ?? 0));

export function ProductsPage() {
  return <ResourcePage
    title="Productos"
    description="Registra productos con código SKU, precio y existencias iniciales."
    endpoint="/products"
    permission="products:read"
    fields={[
      { name: 'name', label: 'Nombre del producto', required: true },
      { name: 'sku', label: 'Código SKU', required: true },
      { name: 'price', label: 'Precio', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'stock', label: 'Existencia inicial', type: 'number', min: 0, step: 1, required: true },
      { name: 'description', label: 'Descripción', type: 'textarea' }
    ]}
    columns={[
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Producto' },
      { key: 'price', label: 'Precio', format: formatPrice },
      { key: 'stock', label: 'Existencia' }
    ]}
  />;
}
