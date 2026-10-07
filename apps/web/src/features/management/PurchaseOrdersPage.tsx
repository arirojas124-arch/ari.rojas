import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { createRecord, listRecords, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type Supplier = ManagedRecord & { name: string; isActive: boolean };
type Warehouse = ManagedRecord & { name: string; code: string; isActive: boolean; isDefault: boolean };
type Product = ManagedRecord & { name: string; sku: string; isActive: boolean };
type PurchaseOrder = ManagedRecord & {
  orderNumber: string;
  supplierName: string;
  warehouseId: string;
  items: Array<{ productId: string; sku: string; name: string; quantity: number; unitCost: number; receivedQuantity: number }>;
  total: number;
  status: 'open' | 'partially_received' | 'received' | 'cancelled';
  createdAt: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
};

const money = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
const statuses: Record<PurchaseOrder['status'], string> = { open: 'Abierta', partially_received: 'Parcial', received: 'Recibida', cancelled: 'Cancelada' };

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('0');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orderRows, supplierRows, warehouseRows, productRows] = await Promise.all([
        listRecords<PurchaseOrder>('/purchases'), listRecords<Supplier>('/suppliers'),
        listRecords<Warehouse>('/warehouses'), listRecords<Product>('/products')
      ]);
      setOrders(orderRows);
      setSuppliers(supplierRows.filter((row) => row.isActive));
      setWarehouses(warehouseRows.filter((row) => row.isActive));
      setProducts(productRows.filter((row) => row.isActive));
      setSupplierId((current) => current || supplierRows.find((row) => row.isActive)?._id || '');
      setWarehouseId((current) => current || warehouseRows.find((row) => row.isDefault && row.isActive)?._id || warehouseRows.find((row) => row.isActive)?._id || '');
      setProductId((current) => current || productRows.find((row) => row.isActive)?._id || '');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron cargar las órdenes.';
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await createRecord('/purchases', {
        supplierId, warehouseId,
        items: [{ productId, quantity: Number(quantity), unitCost: Number(unitCost) }]
      });
      setSuccess('La orden de compra quedó registrada.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la orden.');
    } finally { setSaving(false); }
  }

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Órdenes de compra']} />
    <PageHeader eyebrow="GESTIÓN DE COMPRAS" title="Órdenes de compra" description="Registra pedidos a proveedores y define el almacén donde se recibirá la mercancía." />
    {canWrite ? <section className="resource-panel" aria-label="Crear orden de compra">
      <form className="resource-form purchasing-form" onSubmit={(event) => void submit(event)}>
        <label className="resource-field"><span>Proveedor *</span><select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>{suppliers.map((row) => <option key={row._id} value={row._id}>{row.name}</option>)}</select></label>
        <label className="resource-field"><span>Almacén destino *</span><select required value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>{warehouses.map((row) => <option key={row._id} value={row._id}>{row.name}</option>)}</select></label>
        <label className="resource-field"><span>Producto *</span><select required value={productId} onChange={(event) => setProductId(event.target.value)}>{products.map((row) => <option key={row._id} value={row._id}>{row.sku} · {row.name}</option>)}</select></label>
        <label className="resource-field"><span>Cantidad *</span><input required type="number" min={1} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
        <label className="resource-field"><span>Costo unitario *</span><input required type="number" min={0} step={0.01} value={unitCost} onChange={(event) => setUnitCost(event.target.value)} /></label>
        <div className="resource-dialog-actions"><button className="resource-button resource-button-primary" type="submit" disabled={saving || !supplierId || !warehouseId || !productId}>{saving ? 'Guardando...' : 'Crear orden'}</button></div>
      </form>
    </section> : null}
    {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
    {success ? <p className="resource-message" role="status">{success}</p> : null}
    <section className="resource-panel" aria-label="Órdenes registradas">
      <div className="resource-toolbar"><span className="resource-count">{orders.length} órdenes</span></div>
      {loading ? <p className="resource-message" role="status">Cargando órdenes...</p> : orders.length === 0 ? <div className="resource-empty"><strong>No hay órdenes de compra</strong></div> :
        <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Folio</th><th>Fecha</th><th>Proveedor</th><th>Artículo(s)</th><th>Total</th><th>Estado</th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order._id}>
            <td>{order.orderNumber}</td><td>{new Date(order.createdAt).toLocaleDateString('es-MX')}</td><td>{order.supplierName}</td>
            <td>{order.items.map((item) => `${item.sku} (${item.receivedQuantity}/${item.quantity})`).join(', ')}</td>
            <td>{money(order.total)}</td><td>{statuses[order.status]}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}
