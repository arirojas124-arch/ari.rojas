import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { listRecords, updateRecordAtPath, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type Payable = ManagedRecord & {
  orderNumber: string;
  supplierName: string;
  total: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  createdAt: string;
};
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

export function PayablesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<Payable[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setRows(await listRecords<Payable>('/purchases')); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron cargar las cuentas por pagar.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally { setLoading(false); }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken).then(({ data }) => setCanWrite(data.permissions.includes('finance:write')))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  async function recordPayment(row: Payable) {
    const raw = window.prompt(`Importe pagado a la fecha (total ${money(row.total)}):`, String(row.paidAmount ?? 0));
    if (raw === null) return;
    const paidAmount = Number(raw);
    if (!Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > row.total) {
      setError('Indica un importe válido que no supere el total de la orden.');
      return;
    }
    setSavingId(row._id);
    setError('');
    try {
      await updateRecordAtPath(`/purchases/${encodeURIComponent(row._id)}/payment`, { paidAmount });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo registrar el pago.'); }
    finally { setSavingId(''); }
  }

  const pending = rows.filter((row) => row.paymentStatus !== 'paid');
  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Cuentas por pagar']} />
    <PageHeader eyebrow="GESTIÓN FINANCIERA" title="Cuentas por pagar" description="Consulta los compromisos asociados a órdenes de compra y registra pagos parciales o completos." />
    <section className="resource-panel" aria-label="Cuentas por pagar">
      <div className="resource-toolbar"><span className="resource-count">{pending.length} pendientes · {money(pending.reduce((sum, row) => sum + row.total - row.paidAmount, 0))}</span></div>
      {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
      {loading ? <p className="resource-message" role="status">Cargando cuentas...</p> : rows.length === 0 ? <div className="resource-empty"><strong>No hay cuentas por pagar</strong><span>Las órdenes de compra aparecerán aquí.</span></div> :
        <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Orden</th><th>Fecha</th><th>Proveedor</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th>{canWrite ? <th>Acción</th> : null}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row._id}>
            <td>{row.orderNumber}</td><td>{new Date(row.createdAt).toLocaleDateString('es-MX')}</td><td>{row.supplierName}</td>
            <td>{money(row.total)}</td><td>{money(row.paidAmount)}</td><td>{money(row.total - row.paidAmount)}</td>
            <td>{row.paymentStatus === 'paid' ? 'Pagada' : row.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}</td>
            {canWrite ? <td><button className="resource-link-button" type="button" disabled={savingId === row._id} onClick={() => void recordPayment(row)}>Registrar pago</button></td> : null}
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}
