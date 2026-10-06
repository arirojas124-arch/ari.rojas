import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { createRecord, listRecords, type ManagedRecord } from '../../services/management.service.js';
import './sales-page.css';

type Customer = ManagedRecord & { name: string; email?: string };
type Product = ManagedRecord & { name: string; sku: string; price: number; stock: number };
type SaleItem = { productId: string; quantity: number };
type Sale = ManagedRecord & {
  saleNumber: string;
  customerName: string;
  total: number;
  items: Array<{ name: string; sku: string; quantity: number; unitPrice: number }>;
  createdAt: string;
};

const money = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

export function SalesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<SaleItem[]>([{ productId: '', quantity: 1 }]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [saleRows, customerRows, productRows] = await Promise.all([
        listRecords<Sale>('/sales'),
        listRecords<Customer>('/customers'),
        listRecords<Product>('/products')
      ]);
      setSales(saleRows);
      setCustomers(customerRows.filter((customer) => customer.isActive !== false));
      setProducts(productRows.filter((product) => product.isActive !== false));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar las ventas.';
      if (message.includes('sesión caducó')) {
        navigate('/login', { replace: true, state: { from: location.pathname } });
      } else {
        setLoadError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken)
      .then(({ data }) => setCanWrite(data.permissions.includes('sales:write')))
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'No se pudieron validar permisos.'));
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate._id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0), [items, products]);

  function openDialog() {
    setCustomerId(customers[0]?._id ?? '');
    setItems([{ productId: products[0]?._id ?? '', quantity: 1 }]);
    setSaveError('');
    setDialogOpen(true);
  }

  function updateItem(index: number, patch: Partial<SaleItem>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await createRecord('/sales', {
        customerId,
        items: items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) }))
      });
      setDialogOpen(false);
      await load();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo registrar la venta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="resource-page">
      <Breadcrumbs items={['Inicio', 'Ventas']} />
      <PageHeader eyebrow="GESTIÓN COMERCIAL" title="Ventas" description="Registra ventas; el sistema crea una factura interna y descuenta existencias al confirmar." />
      <section className="resource-panel" aria-label="Ventas registradas">
        <div className="resource-toolbar">
          <span className="resource-count">{sales.length} {sales.length === 1 ? 'venta' : 'ventas'}</span>
          {canWrite ? <button className="resource-button resource-button-primary" type="button" disabled={!customers.length || !products.some((product) => product.stock > 0)} onClick={openDialog}>Nueva venta</button> : null}
        </div>
        {!loading && !loadError && (!customers.length || !products.length) ? <p className="sales-prerequisite">Para registrar ventas, primero agrega al menos un cliente y un producto activo con existencias.</p> : null}
        {loadError ? <div className="resource-alert" role="alert">{loadError}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
        {loading ? <p className="resource-message" role="status">Cargando ventas...</p> : !loadError && sales.length === 0 ? (
          <div className="resource-empty"><strong>Aún no hay ventas</strong><span>Al registrar la primera, se generará su factura interna automáticamente.</span></div>
        ) : !loadError ? (
          <div className="resource-table-wrap">
            <table className="resource-table">
              <thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Artículos</th><th>Total (MXN)</th></tr></thead>
              <tbody>{sales.map((sale) => <tr key={sale._id}>
                <td>{sale.saleNumber}</td>
                <td>{new Date(sale.createdAt).toLocaleString('es-MX')}</td>
                <td>{sale.customerName}</td>
                <td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td>{money(sale.total)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        ) : null}
      </section>

      {dialogOpen ? <div className="resource-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialogOpen(false); }}>
        <section aria-labelledby="sale-dialog-title" aria-modal="true" className="resource-dialog sale-dialog" role="dialog">
          <div className="resource-dialog-header">
            <div><span className="resource-eyebrow">REGISTRO COMERCIAL</span><h2 id="sale-dialog-title">Nueva venta</h2></div>
            <button className="resource-close" type="button" aria-label="Cerrar" disabled={saving} onClick={() => setDialogOpen(false)}>×</button>
          </div>
          <form className="resource-form sale-form" onSubmit={(event) => void submit(event)}>
            <label className="resource-field resource-field-wide"><span>Cliente *</span>
              <select required value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}
              </select>
            </label>
            <div className="sale-lines">
              {items.map((item, index) => {
                const product = products.find((candidate) => candidate._id === item.productId);
                return <div className="sale-line" key={index}>
                  <label className="resource-field"><span>Producto *</span>
                    <select required value={item.productId} onChange={(event) => updateItem(index, { productId: event.target.value })}>
                      {products.map((option) => <option key={option._id} value={option._id} disabled={option.stock <= 0}>{option.sku} · {option.name} (disp. {option.stock})</option>)}
                    </select>
                  </label>
                  <label className="resource-field"><span>Cantidad *</span>
                    <input required type="number" min={1} max={product?.stock ?? 1} step={1} value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} />
                  </label>
                  <span className="sale-line-total">{money((product?.price ?? 0) * item.quantity)}</span>
                  <button className="resource-link-button sale-remove" type="button" aria-label="Quitar producto" disabled={items.length <= 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Quitar</button>
                </div>;
              })}
              <button className="resource-button" type="button" disabled={items.length >= 100 || !products.some((product) => product.stock > 0)} onClick={() => setItems((current) => [...current, { productId: products.find((product) => product.stock > 0)?._id ?? '', quantity: 1 }])}>Agregar otro producto</button>
            </div>
            <div className="sale-total"><span>Total</span><strong>{money(total)}</strong></div>
            <p className="sale-notice">Se creará una factura interna no fiscal. Las existencias se descontarán solo si la venta se guarda correctamente.</p>
            {saveError ? <div className="resource-alert resource-alert-form" role="alert">{saveError}</div> : null}
            <div className="resource-dialog-actions">
              <button className="resource-button" type="button" disabled={saving} onClick={() => setDialogOpen(false)}>Cancelar</button>
              <button className="resource-button resource-button-primary" type="submit" disabled={saving || !customerId || items.some((item) => !item.productId || item.quantity < 1)}>{saving ? 'Guardando...' : 'Confirmar venta'}</button>
            </div>
          </form>
        </section>
      </div> : null}
    </div>
  );
}
