import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { listRecords, updateRecord, type ManagedRecord } from '../../services/management.service.js';
import './sales-page.css';

type Invoice = ManagedRecord & {
  invoiceNumber: string;
  saleNumber: string;
  customerName: string;
  total: number;
  status: 'pending' | 'paid';
  createdAt: string;
};

const money = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

export function InvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInvoices(await listRecords<Invoice>('/invoices'));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron cargar las facturas.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken)
      .then(({ data }) => setCanWrite(data.permissions.includes('invoices:write')))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  async function updateStatus(invoice: Invoice) {
    setSavingId(invoice._id);
    setError('');
    try {
      await updateRecord('/invoices', invoice._id, { status: invoice.status === 'paid' ? 'pending' : 'paid' });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el pago.');
    } finally {
      setSavingId('');
    }
  }

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Facturas']} />
    <PageHeader eyebrow="GESTIÓN COMERCIAL" title="Facturas internas" description="Consulta comprobantes internos no fiscales generados automáticamente al registrar cada venta." />
    <section className="resource-panel" aria-label="Facturas internas">
      <div className="resource-toolbar"><span className="resource-count">{invoices.length} {invoices.length === 1 ? 'factura' : 'facturas'}</span></div>
      {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
      {loading ? <p className="resource-message" role="status">Cargando facturas...</p> : !error && invoices.length === 0 ? (
        <div className="resource-empty"><strong>Aún no hay facturas</strong><span>Se generarán al confirmar una venta.</span></div>
      ) : !error ? <div className="resource-table-wrap"><table className="resource-table">
        <thead><tr><th>Folio</th><th>Venta</th><th>Fecha</th><th>Cliente</th><th>Total (MXN)</th><th>Estado</th>{canWrite ? <th>Acción</th> : null}</tr></thead>
        <tbody>{invoices.map((invoice) => <tr key={invoice._id}>
          <td>{invoice.invoiceNumber}</td>
          <td>{invoice.saleNumber}</td>
          <td>{new Date(invoice.createdAt).toLocaleDateString('es-MX')}</td>
          <td>{invoice.customerName}</td>
          <td>{money(invoice.total)}</td>
          <td><span className={`resource-status${invoice.status === 'pending' ? ' resource-status-inactive' : ''}`}>{invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}</span></td>
          {canWrite ? <td><button className="resource-link-button" type="button" disabled={savingId === invoice._id} onClick={() => void updateStatus(invoice)}>{savingId === invoice._id ? 'Guardando...' : invoice.status === 'paid' ? 'Marcar pendiente' : 'Marcar pagada'}</button></td> : null}
        </tr>)}</tbody>
      </table></div> : null}
    </section>
    <p className="sales-prerequisite">Estos documentos son comprobantes internos y no sustituyen una factura fiscal CFDI.</p>
  </div>;
}
