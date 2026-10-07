import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { createRecord, listRecords, type ManagedRecord } from '../../services/management.service.js';
import './sales-page.css';

type Warehouse = ManagedRecord & { name: string; code: string; isActive: boolean; isDefault: boolean };
type Product = ManagedRecord & { name: string; sku: string; isActive: boolean };
type StockRow = ManagedRecord & {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productName: string;
  sku: string;
  productStock: number;
  quantity: number;
};
type Movement = ManagedRecord & {
  createdAt: string;
  quantityChange: number;
  reason: string;
  warehouseName: string;
  warehouseCode: string;
  productName: string;
  sku: string;
};

export function InventoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantityChange, setQuantityChange] = useState('1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const stockRows = await listRecords<StockRow>('/inventory');
      const [warehouseRows, productRows, movementRows] = await Promise.all([
        listRecords<Warehouse>('/warehouses'),
        listRecords<Product>('/products'),
        listRecords<Movement>('/inventory/movements')
      ]);
      setRows(stockRows);
      setWarehouses(warehouseRows.filter((warehouse) => warehouse.isActive));
      setProducts(productRows.filter((product) => product.isActive));
      setMovements(movementRows);
      setWarehouseId((current) => current || warehouseRows.find((warehouse) => warehouse.isDefault && warehouse.isActive)?._id || warehouseRows[0]?._id || '');
      setProductId((current) => current || productRows.find((product) => product.isActive)?._id || '');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo cargar el inventario.';
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
      .then(({ data }) => setCanWrite(data.permissions.includes('inventory:write')))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await createRecord('/inventory/adjustments', {
        warehouseId, productId, quantityChange: Number(quantityChange), reason
      });
      setReason('');
      setSuccess('El ajuste de existencias quedó registrado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar el ajuste.');
    } finally {
      setSaving(false);
    }
  }

  const selectedRows = rows.filter((row) => row.warehouseId === warehouseId);

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Existencias']} />
    <PageHeader eyebrow="CONTROL DE INVENTARIO" title="Existencias" description="Consulta las unidades por producto y almacén. Cada ajuste deja un movimiento auditable y actualiza el total del producto." />
    {canWrite ? <section className="resource-panel" aria-label="Ajustar existencias">
      <form className="resource-form inventory-adjust-form" onSubmit={(event) => void adjust(event)}>
        <label className="resource-field"><span>Almacén *</span>
          <select required value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
            {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name} · {warehouse.code}</option>)}
          </select>
        </label>
        <label className="resource-field"><span>Producto *</span>
          <select required value={productId} onChange={(event) => setProductId(event.target.value)}>
            {products.map((product) => <option key={product._id} value={product._id}>{product.sku} · {product.name}</option>)}
          </select>
        </label>
        <label className="resource-field"><span>Ajuste (+/- unidades) *</span>
          <input required type="number" step={1} value={quantityChange} onChange={(event) => setQuantityChange(event.target.value)} />
        </label>
        <label className="resource-field"><span>Motivo *</span>
          <input required minLength={3} maxLength={240} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Conteo físico, merma, recepción..." />
        </label>
        <div className="resource-dialog-actions">
          <button className="resource-button resource-button-primary" type="submit" disabled={saving || !warehouseId || !productId || Number(quantityChange) === 0}>{saving ? 'Registrando...' : 'Registrar ajuste'}</button>
        </div>
      </form>
    </section> : null}
    {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
    {success ? <p className="resource-message" role="status">{success}</p> : null}
    <section className="resource-panel" aria-label="Existencias por almacén">
      <div className="resource-toolbar">
        <label className="resource-field"><span>Almacén</span>
          <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
            {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
          </select>
        </label>
        <span className="resource-count">{selectedRows.length} productos</span>
      </div>
      {loading ? <p className="resource-message" role="status">Cargando existencias...</p> : selectedRows.length === 0 ? (
        <div className="resource-empty"><strong>No hay existencias registradas</strong><span>Agrega un producto o registra una entrada para este almacén.</span></div>
      ) : <div className="resource-table-wrap"><table className="resource-table">
        <thead><tr><th>SKU</th><th>Producto</th><th>Existencia en almacén</th><th>Total en empresa</th></tr></thead>
        <tbody>{selectedRows.map((row) => <tr key={row._id}><td>{row.sku}</td><td>{row.productName}</td><td>{row.quantity}</td><td>{row.productStock}</td></tr>)}</tbody>
      </table></div>}
    </section>
    <section className="resource-panel" aria-label="Movimientos recientes">
      <div className="resource-toolbar"><strong>Movimientos recientes</strong><span className="resource-count">{movements.length}</span></div>
      {movements.length === 0 ? <p className="resource-message">Los ajustes aparecerán aquí.</p> : <div className="resource-table-wrap"><table className="resource-table">
        <thead><tr><th>Fecha</th><th>Almacén</th><th>Producto</th><th>Cambio</th><th>Motivo</th></tr></thead>
        <tbody>{movements.map((movement) => <tr key={movement._id}>
          <td>{new Date(movement.createdAt).toLocaleString('es-MX')}</td><td>{movement.warehouseName}</td><td>{movement.sku} · {movement.productName}</td>
          <td>{movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}</td><td>{movement.reason}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </div>;
}
