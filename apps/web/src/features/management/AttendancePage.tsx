import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { createRecord, listRecords, updateRecord, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type Employee = ManagedRecord & { employeeNumber: string; name: string; isActive: boolean };
type Attendance = ManagedRecord & {
  employeeId: string;
  employeeName: string;
  workDate: string;
  status: 'present' | 'absent' | 'leave';
  notes?: string;
};
const statusNames: Record<Attendance['status'], string> = { present: 'Asistencia', absent: 'Falta', leave: 'Permiso' };

export function AttendancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<Attendance[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<Attendance['status']>('present');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [attendanceRows, employeeRows] = await Promise.all([
        listRecords<Attendance>('/attendance'), listRecords<Employee>('/employees')
      ]);
      setRows(attendanceRows);
      setEmployees(employeeRows.filter((employee) => employee.isActive));
      setEmployeeId((current) => current || employeeRows.find((employee) => employee.isActive)?._id || '');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo cargar la asistencia.';
      if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
      else setError(message);
    } finally { setLoading(false); }
  }, [location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken).then(({ data }) => setCanWrite(data.permissions.includes('attendance:write')))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await createRecord('/attendance', { employeeId, workDate, status, notes });
      setSuccess('La asistencia quedó registrada o actualizada.');
      setNotes('');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la asistencia.'); }
    finally { setSaving(false); }
  }

  async function updateStatus(row: Attendance, nextStatus: Attendance['status']) {
    setError('');
    try {
      await updateRecord('/attendance', row._id, { status: nextStatus });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la asistencia.'); }
  }

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Asistencia y permisos']} />
    <PageHeader eyebrow="GESTIÓN DE PERSONAS" title="Asistencia y permisos" description="Registra por día la asistencia, falta o permiso de cada empleado. Un registro por empleado y fecha." />
    {canWrite ? <section className="resource-panel" aria-label="Capturar asistencia">
      <form className="resource-form purchasing-form" onSubmit={(event) => void submit(event)}>
        <label className="resource-field"><span>Empleado *</span>
          <select required value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            {employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.employeeNumber} · {employee.name}</option>)}
          </select>
        </label>
        <label className="resource-field"><span>Fecha *</span><input required type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} /></label>
        <label className="resource-field"><span>Registro *</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as Attendance['status'])}>
            {Object.entries(statusNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="resource-field"><span>Notas</span><input maxLength={300} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <div className="resource-dialog-actions"><button className="resource-button resource-button-primary" type="submit" disabled={saving || !employeeId}>{saving ? 'Guardando...' : 'Guardar registro'}</button></div>
      </form>
    </section> : null}
    {error ? <div className="resource-alert" role="alert">{error}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
    {success ? <p className="resource-message" role="status">{success}</p> : null}
    <section className="resource-panel" aria-label="Registros de asistencia">
      <div className="resource-toolbar"><span className="resource-count">{rows.length} registros</span></div>
      {loading ? <p className="resource-message" role="status">Cargando asistencia...</p> : rows.length === 0 ? <div className="resource-empty"><strong>Sin registros de asistencia</strong></div> :
        <div className="resource-table-wrap"><table className="resource-table">
          <thead><tr><th>Fecha</th><th>Empleado</th><th>Estado</th><th>Notas</th>{canWrite ? <th>Marcar</th> : null}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row._id}>
            <td>{new Date(row.workDate).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</td><td>{row.employeeName}</td>
            <td>{statusNames[row.status]}</td><td>{row.notes || '—'}</td>
            {canWrite ? <td className="resource-actions">
              {(['present', 'absent', 'leave'] as const).filter((value) => value !== row.status).map((value) =>
                <button className="resource-link-button" type="button" key={value} onClick={() => void updateStatus(row, value)}>{statusNames[value]}</button>
              )}
            </td> : null}
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}
