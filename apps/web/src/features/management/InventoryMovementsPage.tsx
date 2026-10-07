import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { listRecords, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type Movement = ManagedRecord & {
  createdAt: string;
  quantityChange: number;
  reason: string;
  warehouseName: string;
  warehouseCode: string;
  productName: string;
  sku: string;
};

export function InventoryMovementsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listRecords<Movement>('/inventory/movements'));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron cargar los movimientos.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Movimientos']} />
    <PageHeader eyebrow="CONTROL DE INVENTARIO" title="Movimientos" description="Historial de ajustes manuales y salidas generadas por ventas, con producto, almacén, cantidad y motivo." />
    <section className="resource-panel" aria-label="Historial de movimientos">
      <div className="resource-toolbar"><span className="resource-count">{rows.length} movimientos recientes</span></div>
      {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
      {loading ? <p className="resource-message" role="status">Cargando movimientos...</p> : !error && rows.length === 0 ? (
        <div className="resource-empty"><strong>Aún no hay movimientos</strong><span>Los ajustes y ventas quedarán registrados aquí.</span></div>
      ) : !error ? <div className="resource-table-wrap"><table className="resource-table">
        <thead><tr><th>Fecha</th><th>Almacén</th><th>Producto</th><th>Cambio</th><th>Motivo</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row._id}>
          <td>{new Date(row.createdAt).toLocaleString('es-MX')}</td>
          <td>{row.warehouseName} · {row.warehouseCode}</td>
          <td>{row.sku} · {row.productName}</td>
          <td>{row.quantityChange > 0 ? '+' : ''}{row.quantityChange}</td>
          <td>{row.reason}</td>
        </tr>)}</tbody>
      </table></div> : null}
    </section>
  </div>;
}
