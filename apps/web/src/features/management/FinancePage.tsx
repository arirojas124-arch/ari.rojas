import { ResourcePage } from './ResourcePage.js';

const money = (value: unknown) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value ?? 0));

export function FinancePage() {
  return <ResourcePage
    title="Ingresos y gastos"
    description="Registra los movimientos de caja de la empresa y consulta su historial por fecha."
    endpoint="/finance"
    permission="finance:read"
    fields={[
      { name: 'kind', label: 'Tipo', type: 'select', required: true, options: [
        { label: 'Ingreso', value: 'income' }, { label: 'Gasto', value: 'expense' }
      ] },
      { name: 'category', label: 'Categoría', required: true },
      { name: 'description', label: 'Descripción', required: true },
      { name: 'amount', label: 'Importe (MXN)', type: 'number', min: 0.01, step: 0.01, required: true },
      { name: 'occurredAt', label: 'Fecha', type: 'date', required: true },
      { name: 'reference', label: 'Referencia' }
    ]}
    columns={[
      { key: 'occurredAt', label: 'Fecha', format: (value) => value ? new Date(String(value)).toLocaleDateString('es-MX') : '—' },
      { key: 'kind', label: 'Tipo', format: (value) => value === 'income' ? 'Ingreso' : 'Gasto' },
      { key: 'category', label: 'Categoría' },
      { key: 'description', label: 'Descripción' },
      { key: 'amount', label: 'Importe', format: money },
      { key: 'reference', label: 'Referencia' }
    ]}
  />;
}
