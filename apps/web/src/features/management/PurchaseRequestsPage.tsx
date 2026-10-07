import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { createRecord, listRecords, updateRecord, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type Product = ManagedRecord & { name: string; sku: string; isActive: boolean };
type RequestLine = { productId: string; sku: string; name: string; quantity: number };
type PurchaseRequest = ManagedRecord & {
  requestNumber: string;
  reason: string;
  items: RequestLine[];
  status: 'draft' | 'approved' | 'rejected';
  createdAt: string;
};

const statuses: Record<PurchaseRequest['status'], string> = { draft: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };

export function PurchaseRequestsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [canRequest, setCanRequest] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [requestRows, productRows] = await Promise.all([
        listRecords<PurchaseRequest>('/purchase-requests'), listRecords<Product>('/products')
      ]);
      setRequests(requestRows);
      setProducts(productRows.filter((product) => product.isActive));
      setProductId((current) => current || productRows.find((product) => product.isActive)?._id || '');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally { setLoading(false); }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken).then(({ data }) => {
      setCanRequest(data.permissions.includes('purchases:request'));
      setCanApprove(data.permissions.includes('purchases:approve'));
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await createRecord('/purchase-requests', { reason, items: [{ productId, quantity: Number(quantity) }] });
      setReason('');
      setSuccess('La solicitud de compra quedó registrada.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la solicitud.');
    } finally { setSaving(false); }
  }

  async function resolveRequest(row: PurchaseRequest, status: 'approved' | 'rejected') {
    setError('');
    try {
      await updateRecord('/purchase-requests', row._id, { status });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la solicitud.');
    }
  }

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Solicitudes']} />
    <PageHeader eyebrow="GESTIÓN DE COMPRAS" title="Solicitudes de compra" description="Registra necesidades de abastecimiento y revisa su aprobación antes de emitir una orden." />
    {canRequest ? <section className="resource-panel" aria-label="Crear solicitud de compra">
      <form className="resource-form purchasing-form" onSubmit={(event) => void submit(event)}>
        <label className="resource-field"><span>Producto *</span>
          <select required value={productId} onChange={(event) => setProductId(event.target.value)}>{products.map((product) => <option key={product._id} value={product._id}>{product.sku} · {product.name}</option>)}</select>
        </label>
        <label className="resource-field"><span>Cantidad *</span><input required type="number" min={1} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
        <label className="resource-field resource-field-wide"><span>Motivo *</span><input required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <div className="resource-dialog-actions"><button className="resource-button resource-button-primary" type="submit" disabled={saving || !productId}>{saving ? 'Enviando...' : 'Solicitar compra'}</button></div>
      </form>
    </section> : null}
    {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
    {success ? <p className="resource-message" role="status">{success}</p> : null}
    <section className="resource-panel" aria-label="Solicitudes registradas">
      <div className="resource-toolbar"><span className="resource-count">{requests.length} solicitudes</span></div>
      {loading ? <p className="resource-message" role="status">Cargando solicitudes...</p> : requests.length === 0 ? <div className="resource-empty"><strong>No hay solicitudes de compra</strong></div> :
        <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Folio</th><th>Fecha</th><th>Producto(s)</th><th>Cantidad</th><th>Motivo</th><th>Estado</th>{canApprove ? <th>Acciones</th> : null}</tr></thead>
          <tbody>{requests.map((row) => <tr key={row._id}>
            <td>{row.requestNumber}</td><td>{new Date(row.createdAt).toLocaleDateString('es-MX')}</td>
            <td>{row.items.map((item) => `${item.sku} · ${item.name}`).join(', ')}</td>
            <td>{row.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>{row.reason}</td><td>{statuses[row.status]}</td>
            {canApprove ? <td className="resource-actions">{row.status === 'draft' ? <>
              <button className="resource-link-button" type="button" onClick={() => void resolveRequest(row, 'approved')}>Aprobar</button>
              <button className="resource-link-button" type="button" onClick={() => void resolveRequest(row, 'rejected')}>Rechazar</button>
            </> : '—'}</td> : null}
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}
