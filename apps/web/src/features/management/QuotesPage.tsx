import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { createRecord, listRecords, updateRecord, type ManagedRecord } from '../../services/management.service.js';
import './sales-page.css';

type Customer = ManagedRecord & { name: string; isActive: boolean };
type Product = ManagedRecord & { name: string; sku: string; price: number; isActive: boolean };
type QuoteLine = { productId: string; quantity: number };
type Quote = ManagedRecord & {
  quoteNumber: string;
  customerName: string;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil?: string;
  createdAt: string;
  items: Array<{ name: string; sku: string; quantity: number; unitPrice: number }>;
};

const money = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
const quoteStatus: Record<Quote['status'], string> = { draft: 'Borrador', sent: 'Enviada', accepted: 'Aceptada', rejected: 'Rechazada' };

export function QuotesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<QuoteLine[]>([{ productId: '', quantity: 1 }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [quoteRows, customerRows, productRows] = await Promise.all([
        listRecords<Quote>('/quotes'), listRecords<Customer>('/customers'), listRecords<Product>('/products')
      ]);
      setQuotes(quoteRows);
      setCustomers(customerRows.filter((item) => item.isActive));
      setProducts(productRows.filter((item) => item.isActive));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron cargar las cotizaciones.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally { setLoading(false); }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken)
      .then(({ data }) => setCanWrite(data.permissions.includes('quotes:write')))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => {
    const product = products.find((entry) => entry._id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0), [items, products]);

  function openDialog() {
    setCustomerId(customers[0]?._id ?? '');
    setItems([{ productId: products[0]?._id ?? '', quantity: 1 }]);
    setValidUntil('');
    setDialogOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createRecord('/quotes', {
        customerId, items: items.map((item) => ({ ...item, quantity: Number(item.quantity) })),
        ...(validUntil ? { validUntil } : {})
      });
      setDialogOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la cotización.');
    } finally { setSaving(false); }
  }

  async function changeStatus(quote: Quote, status: 'sent' | 'accepted' | 'rejected') {
    setError('');
    try {
      await updateRecord('/quotes', quote._id, { status });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el estado.');
    }
  }

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Cotizaciones']} />
    <PageHeader eyebrow="GESTIÓN COMERCIAL" title="Cotizaciones" description="Prepara propuestas para tus clientes con importes guardados como snapshot; aceptar una cotización no registra ni descuenta una venta." />
    <section className="resource-panel" aria-label="Cotizaciones registradas">
      <div className="resource-toolbar">
        <span className="resource-count">{quotes.length} {quotes.length === 1 ? 'cotización' : 'cotizaciones'}</span>
        {canWrite ? <button className="resource-button resource-button-primary" type="button" disabled={!customers.length || !products.length} onClick={openDialog}>Nueva cotización</button> : null}
      </div>
      {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
      {loading ? <p className="resource-message" role="status">Cargando cotizaciones...</p> : quotes.length === 0 ? (
        <div className="resource-empty"><strong>Aún no hay cotizaciones</strong><span>Prepara una propuesta para comenzar.</span></div>
      ) : <div className="resource-table-wrap"><table className="resource-table">
        <thead><tr><th>Folio</th><th>Fecha</th><th>Vigencia</th><th>Cliente</th><th>Artículos</th><th>Total (MXN)</th><th>Estado</th>{canWrite ? <th>Acciones</th> : null}</tr></thead>
        <tbody>{quotes.map((quote) => <tr key={quote._id}>
          <td>{quote.quoteNumber}</td><td>{new Date(quote.createdAt).toLocaleDateString('es-MX')}</td>
          <td>{quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-MX') : '—'}</td>
          <td>{quote.customerName}</td><td>{quote.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>{money(quote.total)}</td><td>{quoteStatus[quote.status]}</td>
          {canWrite ? <td className="resource-actions">
            {quote.status === 'draft' ? <button className="resource-link-button" type="button" onClick={() => void changeStatus(quote, 'sent')}>Marcar enviada</button> : null}
            {quote.status === 'sent' ? <>
              <button className="resource-link-button" type="button" onClick={() => void changeStatus(quote, 'accepted')}>Aceptar</button>
              <button className="resource-link-button" type="button" onClick={() => void changeStatus(quote, 'rejected')}>Rechazar</button>
            </> : null}
          </td> : null}
        </tr>)}</tbody>
      </table></div>}
    </section>
    {dialogOpen ? <div className="resource-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialogOpen(false); }}>
      <section aria-labelledby="quote-dialog-title" aria-modal="true" className="resource-dialog sale-dialog" role="dialog">
        <div className="resource-dialog-header"><div><span className="resource-eyebrow">PROPUESTA COMERCIAL</span><h2 id="quote-dialog-title">Nueva cotización</h2></div>
          <button className="resource-close" type="button" aria-label="Cerrar" disabled={saving} onClick={() => setDialogOpen(false)}>×</button></div>
        <form className="resource-form sale-form" onSubmit={(event) => void submit(event)}>
          <label className="resource-field"><span>Cliente *</span>
            <select required value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}
            </select>
          </label>
          <label className="resource-field"><span>Válida hasta</span><input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></label>
          <div className="sale-lines">
            {items.map((item, index) => {
              const product = products.find((entry) => entry._id === item.productId);
              return <div className="sale-line" key={index}>
                <label className="resource-field"><span>Producto *</span>
                  <select required value={item.productId} onChange={(event) => setItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, productId: event.target.value } : line))}>
                    {products.map((option) => <option key={option._id} value={option._id}>{option.sku} · {option.name}</option>)}
                  </select>
                </label>
                <label className="resource-field"><span>Cantidad *</span><input required type="number" min={1} step={1} value={item.quantity} onChange={(event) => setItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: Number(event.target.value) } : line))} /></label>
                <span className="sale-line-total">{money((product?.price ?? 0) * item.quantity)}</span>
                <button className="resource-link-button sale-remove" type="button" aria-label="Quitar producto" disabled={items.length <= 1} onClick={() => setItems((current) => current.filter((_, lineIndex) => lineIndex !== index))}>Quitar</button>
              </div>;
            })}
            <button className="resource-button" type="button" disabled={items.length >= 100 || !products.length} onClick={() => setItems((current) => [...current, { productId: products[0]?._id ?? '', quantity: 1 }])}>Agregar otro producto</button>
          </div>
          <div className="sale-total"><span>Total</span><strong>{money(total)}</strong></div>
          <p className="sale-notice">Los precios se guardan en la cotización y no modifican existencias ni crean una venta.</p>
          <div className="resource-dialog-actions">
            <button className="resource-button" type="button" disabled={saving} onClick={() => setDialogOpen(false)}>Cancelar</button>
            <button className="resource-button resource-button-primary" type="submit" disabled={saving || !customerId || items.some((item) => !item.productId || item.quantity < 1)}>{saving ? 'Guardando...' : 'Guardar borrador'}</button>
          </div>
        </form>
      </section>
    </div> : null}
  </div>;
}
