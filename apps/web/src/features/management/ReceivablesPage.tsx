import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { listRecords, updateRecord, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type Receivable = ManagedRecord & {
  invoiceNumber: string;
  saleNumber: string;
  customerName: string;
  total: number;
  status: 'pending' | 'paid';
  createdAt: string;
};
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

export function ReceivablesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<Receivable[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setRows(await listRecords<Receivable>('/invoices')); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron cargar las cuentas por cobrar.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally { setLoading(false); }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken).then(({ data }) => setCanWrite(data.permissions.includes('invoices:write')))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  async function toggle(row: Receivable) {
    setSavingId(row._id);
    setError('');
    try {
      await updateRecord('/invoices', row._id, { status: row.status === 'paid' ? 'pending' : 'paid' });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el cobro.'); }
    finally { setSavingId(''); }
  }

  const pending = rows.filter((row) => row.status === 'pending');
  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Cuentas por cobrar']} />
    <PageHeader eyebrow="GESTIÓN FINANCIERA" title="Cuentas por cobrar" description="Facturas de ventas pendientes y pagadas; actualizar el cobro sincroniza el estado de la factura." />
    <section className="resource-panel" aria-label="Cuentas por cobrar">
      <div className="resource-toolbar"><span className="resource-count">{pending.length} pendientes · {money(pending.reduce((sum, row) => sum + row.total, 0))}</span></div>
      {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
      {loading ? <p className="resource-message" role="status">Cargando cuentas...</p> : rows.length === 0 ? <div className="resource-empty"><strong>No hay cuentas por cobrar</strong><span>Las ventas generarán facturas automáticamente.</span></div> :
        <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Factura</th><th>Venta</th><th>Fecha</th><th>Cliente</th><th>Importe</th><th>Estado</th>{canWrite ? <th>Acción</th> : null}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row._id}>
            <td>{row.invoiceNumber}</td><td>{row.saleNumber}</td><td>{new Date(row.createdAt).toLocaleDateString('es-MX')}</td>
            <td>{row.customerName}</td><td>{money(row.total)}</td><td>{row.status === 'paid' ? 'Pagada' : 'Pendiente'}</td>
            {canWrite ? <td><button className="resource-link-button" type="button" disabled={savingId === row._id} onClick={() => void toggle(row)}>{row.status === 'paid' ? 'Marcar pendiente' : 'Registrar cobro'}</button></td> : null}
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}
