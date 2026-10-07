import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { listRecords, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type AuditEvent = ManagedRecord & {
  userId: string;
  action: string;
  resource: string;
  method: string;
  statusCode: number;
  occurredAt: string;
};

export function AuditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setRows(await listRecords<AuditEvent>('/audit')); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo cargar la auditoría.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally { setLoading(false); }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Auditoría']} />
    <PageHeader eyebrow="SEGURIDAD Y CONTROL" title="Auditoría" description="Registro de operaciones de escritura autenticadas, con usuario, recurso, resultado HTTP y fecha." />
    <section className="resource-panel" aria-label="Eventos de auditoría">
      <div className="resource-toolbar"><span className="resource-count">{rows.length} eventos recientes</span></div>
      {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
      {loading ? <p className="resource-message" role="status">Cargando auditoría...</p> : rows.length === 0 ? <div className="resource-empty"><strong>No hay eventos registrados</strong><span>Las siguientes operaciones de escritura autenticadas aparecerán aquí.</span></div> :
        <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Recurso</th><th>Resultado</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row._id}>
            <td>{new Date(row.occurredAt).toLocaleString('es-MX')}</td><td>{row.userId}</td>
            <td>{row.method}</td><td>{row.resource}</td><td>{row.statusCode}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}
