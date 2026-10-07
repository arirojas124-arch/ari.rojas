import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { createRecord, listRecords, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type PurchaseOrder = ManagedRecord & {
  orderNumber: string;
  supplierName: string;
  items: Array<{ productId: string; sku: string; name: string; quantity: number; receivedQuantity: number }>;
  status: 'open' | 'partially_received' | 'received' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
};
type Receipt = ManagedRecord & {
  receiptNumber: string;
  orderNumber: string;
  createdAt: string;
  items: Array<{ sku: string; name: string; quantity: number }>;
};

export function ReceiptsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receivingId, setReceivingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orderRows, receiptRows] = await Promise.all([
        listRecords<PurchaseOrder>('/purchases'), listRecords<Receipt>('/receipts')
      ]);
      setOrders(orderRows);
      setReceipts(receiptRows);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron cargar las recepciones.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally { setLoading(false); }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken).then(({ data }) => setCanWrite(data.permissions.includes('purchases:write')))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  async function receive(order: PurchaseOrder) {
    setReceivingId(order._id);
    setError('');
    setSuccess('');
    try {
      await createRecord(`/purchases/${encodeURIComponent(order._id)}/receipts`, {
        items: order.items.filter((item) => item.quantity > item.receivedQuantity)
          .map((item) => ({ productId: item.productId, quantity: item.quantity - item.receivedQuantity }))
      });
      setSuccess(`Se recibió la mercancía pendiente de la orden ${order.orderNumber}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la recepción.');
    } finally { setReceivingId(''); }
  }

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Recepciones']} />
    <PageHeader eyebrow="GESTIÓN DE COMPRAS" title="Recepciones" description="Registra la llegada de mercancía pendiente; el inventario del almacén de la orden se incrementa automáticamente." />
    {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
    {success ? <p className="resource-message" role="status">{success}</p> : null}
    <section className="resource-panel" aria-label="Órdenes con mercancía pendiente">
      <div className="resource-toolbar"><strong>Órdenes pendientes</strong></div>
      {loading ? <p className="resource-message" role="status">Cargando órdenes...</p> : orders.filter((order) => order.status === 'open' || order.status === 'partially_received').length === 0 ?
        <div className="resource-empty"><strong>No hay órdenes pendientes de recepción</strong></div> :
        <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Orden</th><th>Proveedor</th><th>Productos pendientes</th>{canWrite ? <th>Acción</th> : null}</tr></thead>
          <tbody>{orders.filter((order) => order.status === 'open' || order.status === 'partially_received').map((order) => (
            <tr key={order._id}><td>{order.orderNumber}</td><td>{order.supplierName}</td>
              <td>{order.items.filter((item) => item.quantity > item.receivedQuantity).map((item) => `${item.sku}: ${item.quantity - item.receivedQuantity}`).join(', ')}</td>
              {canWrite ? <td><button className="resource-link-button" type="button" disabled={receivingId === order._id} onClick={() => void receive(order)}>{receivingId === order._id ? 'Registrando...' : 'Recibir pendiente'}</button></td> : null}
            </tr>
          ))}</tbody>
        </table></div>}
    </section>
    <section className="resource-panel" aria-label="Historial de recepciones">
      <div className="resource-toolbar"><strong>Historial de recepciones</strong><span className="resource-count">{receipts.length}</span></div>
      {receipts.length === 0 ? <p className="resource-message">Las recepciones confirmadas aparecerán aquí.</p> :
        <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Folio</th><th>Fecha</th><th>Orden</th><th>Productos recibidos</th></tr></thead>
          <tbody>{receipts.map((receipt) => <tr key={receipt._id}>
            <td>{receipt.receiptNumber}</td><td>{new Date(receipt.createdAt).toLocaleString('es-MX')}</td><td>{receipt.orderNumber}</td>
            <td>{receipt.items.map((item) => `${item.sku}: ${item.quantity}`).join(', ')}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}
