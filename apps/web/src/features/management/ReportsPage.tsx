import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getSession } from '../../services/auth.service.js';
import { authenticatedFetch } from '../../services/auth.service.js';
import './sales-page.css';

type ReportData = {
  currency: 'MXN';
  period: { from: string | null; to: string | null };
  sales: { count: number; total: number; average: number };
  invoices: {
    paid: { count: number; total: number };
    pending: { count: number; total: number };
  };
  topProducts: Array<{ sku: string; name: string; quantity: number; total: number }>;
  dailySales: Array<{ date: string; count: number; total: number }>;
};

type ReportResponse = { data?: ReportData; error?: { message?: string } };
const money = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((value) => {
    const text = String(value);
    const safeText = typeof value === 'string' && /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    try {
      const response = await authenticatedFetch(`/reports/sales${params.size ? `?${params}` : ''}`);
      if (response.status === 401) {
        navigate('/login', { replace: true, state: { from: location.pathname } });
        return;
      }
      const body = await response.json() as ReportResponse;
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? 'No se pudo generar el reporte.');
      setReport(body.data);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo generar el reporte.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [from, location.pathname, navigate, to]);

  useEffect(() => {
    if (!getSession()) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }
    void load();
  }, [load, location.pathname, navigate]);

  function exportReport() {
    if (!report) return;
    const rows: Array<Array<string | number>> = [
      ['Reporte de ventas ARI ERP', 'MXN'],
      ['Desde', report.period.from ?? 'Sin límite'],
      ['Hasta', report.period.to ?? 'Sin límite'],
      [],
      ['Resumen', 'Cantidad', 'Importe'],
      ['Ventas', report.sales.count, report.sales.total],
      ['Facturas pagadas', report.invoices.paid.count, report.invoices.paid.total],
      ['Facturas pendientes', report.invoices.pending.count, report.invoices.pending.total],
      [],
      ['Producto', 'SKU', 'Unidades', 'Venta total'],
      ...report.topProducts.map((product) => [product.name, product.sku, product.quantity, product.total]),
      [],
      ['Fecha', 'Ventas', 'Importe'],
      ...report.dailySales.map((day) => [day.date, day.count, day.total])
    ];
    downloadCsv('reporte-ventas.csv', rows);
  }

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Reportes']} />
    <PageHeader eyebrow="ANÁLISIS DE OPERACIÓN" title="Reportes de ventas" description="Consulta ingresos, documentos pendientes y productos más vendidos por periodo." />
    <section className="resource-panel report-filter" aria-label="Filtros del reporte">
      <label className="resource-field"><span>Desde</span><input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
      <label className="resource-field"><span>Hasta</span><input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
      <button className="resource-button resource-button-primary" type="button" disabled={loading || Boolean(from && to && from > to)} onClick={() => void load()}>{loading ? 'Generando...' : 'Generar reporte'}</button>
      <button className="resource-button" type="button" disabled={!report || loading} onClick={exportReport}>Descargar CSV</button>
    </section>

    {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
    {loading ? <p className="resource-message" role="status">Generando reporte...</p> : report ? <>
      <section className="report-kpis" aria-label="Resumen del periodo">
        <article className="report-kpi"><span>Ventas registradas</span><strong>{report.sales.count}</strong></article>
        <article className="report-kpi"><span>Venta total</span><strong>{money(report.sales.total)}</strong></article>
        <article className="report-kpi"><span>Promedio por venta</span><strong>{money(report.sales.average)}</strong></article>
        <article className="report-kpi"><span>Facturas pendientes</span><strong>{money(report.invoices.pending.total)}</strong><small>{report.invoices.pending.count} documentos</small></article>
        <article className="report-kpi"><span>Facturas pagadas</span><strong>{money(report.invoices.paid.total)}</strong><small>{report.invoices.paid.count} documentos</small></article>
      </section>

      <section className="resource-panel report-section">
        <div className="report-section-header"><div><h2>Productos más vendidos</h2><p>Ordenados por importe total del periodo.</p></div></div>
        {report.topProducts.length ? <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Producto</th><th>SKU</th><th>Unidades</th><th>Venta total</th></tr></thead>
          <tbody>{report.topProducts.map((product) => <tr key={product.sku}><td>{product.name}</td><td>{product.sku}</td><td>{product.quantity}</td><td>{money(product.total)}</td></tr>)}</tbody>
        </table></div> : <div className="resource-empty"><strong>No hay ventas en este periodo</strong><span>Registra una venta para ver información aquí.</span></div>}
      </section>

      <section className="resource-panel report-section">
        <div className="report-section-header"><div><h2>Ventas por día</h2><p>Importes registrados cada día, en MXN.</p></div></div>
        {report.dailySales.length ? <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Fecha</th><th>Ventas</th><th>Importe total</th></tr></thead>
          <tbody>{report.dailySales.map((day) => <tr key={day.date}><td>{new Date(`${day.date}T00:00:00`).toLocaleDateString('es-MX')}</td><td>{day.count}</td><td>{money(day.total)}</td></tr>)}</tbody>
        </table></div> : <div className="resource-empty"><strong>No hay ventas en este periodo</strong><span>Registra una venta para ver información aquí.</span></div>}
      </section>
    </> : null}
    <p className="sales-prerequisite">Los importes son reportes internos en MXN; las facturas mostradas no son CFDI fiscales.</p>
  </div>;
}
