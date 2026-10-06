import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { createRecord, listRecords, updateRecord, type ManagedRecord } from '../../services/management.service.js';
import './resource-page.css';

type Field = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  required?: boolean;
  createOnly?: boolean;
  minLength?: number;
  min?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
};

type ResourceColumn = {
  key: string;
  label: string;
  format?: (value: unknown) => string;
};

type ResourcePageProps = {
  title: string;
  description: string;
  endpoint: string;
  permission: string;
  fields: Field[];
  columns: ResourceColumn[];
};

export function ResourcePage({ title, description, endpoint, permission, fields, columns }: ResourcePageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ManagedRecord[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setRows(await listRecords<ManagedRecord>(endpoint));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los registros.';
      if (message.includes('sesión caducó')) {
        navigate('/login', { replace: true, state: { from: location.pathname } });
        return;
      }
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, location.pathname, navigate]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken)
      .then(({ data }) => setCanWrite(data.permissions.includes(permission.replace(':read', ':write'))))
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'No se pudieron validar los permisos.');
      });
  }, [permission]);

  function openCreate() {
    setEditing(null);
    setSaveError('');
    setForm(Object.fromEntries(fields.map((field) => [field.name, field.options?.[0]?.value ?? ''])));
    setDialogOpen(true);
  }

  function openEdit(record: ManagedRecord) {
    setEditing(record);
    setSaveError('');
    setForm(Object.fromEntries(fields.map((field) => [field.name, String(record[field.name] ?? '')])));
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;
    setDialogOpen(false);
    setEditing(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    const input: Record<string, unknown> = {};
    for (const field of fields) {
      if (editing && field.createOnly) continue;
      if (field.type === 'password' && editing && !form[field.name]) continue;
      input[field.name] = field.type === 'number' ? Number(form[field.name]) : form[field.name];
    }

    try {
      if (editing) {
        await updateRecord(endpoint, editing._id, input);
      } else {
        await createRecord(endpoint, input);
      }
      setDialogOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar el registro.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(record: ManagedRecord) {
    try {
      await updateRecord(endpoint, record._id, { isActive: record.isActive === false });
      await load();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cambiar el estado.');
    }
  }

  const filteredRows = rows.filter((row) => {
    const normalized = query.trim().toLocaleLowerCase();
    return !normalized || columns.some(({ key }) => String(row[key] ?? '').toLocaleLowerCase().includes(normalized));
  });
  return (
    <div className="resource-page">
      <Breadcrumbs items={['Inicio', title]} />
      <PageHeader eyebrow="GESTIÓN DE EMPRESA" title={title} description={description} />
      <section className="resource-panel" aria-label={`Registros de ${title}`}>
        <div className="resource-toolbar">
          <label className="resource-search">
            <span className="sr-only">Buscar {title.toLocaleLowerCase()}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${title.toLocaleLowerCase()}...`} />
          </label>
          <span className="resource-count">{rows.length} {rows.length === 1 ? 'registro' : 'registros'}</span>
          {canWrite ? <button className="resource-button resource-button-primary" type="button" onClick={openCreate}>Nuevo registro</button> : null}
        </div>

        {loadError ? <div className="resource-alert" role="alert">{loadError}<button type="button" onClick={() => void load()}>Reintentar</button></div> : null}
        {loading ? <p className="resource-message" role="status">Cargando registros...</p> : !loadError && rows.length === 0 ? (
          <div className="resource-empty"><strong>Aún no hay registros</strong><span>Agrega el primer registro para comenzar.</span></div>
        ) : !loadError && filteredRows.length === 0 ? (
          <div className="resource-empty"><strong>Sin resultados</strong><span>Prueba con otro término de búsqueda.</span></div>
        ) : !loadError ? (
          <div className="resource-table-wrap">
            <table className="resource-table">
              <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Estado</th>{canWrite ? <th>Acciones</th> : null}</tr></thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row._id}>
                    {columns.map((column) => <td key={column.key}>{column.format ? column.format(row[column.key]) : String(row[column.key] ?? '—')}</td>)}
                    <td><span className={`resource-status${row.isActive === false ? ' resource-status-inactive' : ''}`}>{row.isActive === false ? 'Inactivo' : 'Activo'}</span></td>
                    {canWrite ? <td className="resource-actions">
                      <button className="resource-link-button" type="button" onClick={() => openEdit(row)}>Editar</button>
                      <button className="resource-link-button" type="button" onClick={() => void toggleStatus(row)}>{row.isActive === false ? 'Activar' : 'Desactivar'}</button>
                    </td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {dialogOpen ? <div className="resource-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        <section aria-labelledby="resource-dialog-title" aria-modal="true" className="resource-dialog" role="dialog">
          <div className="resource-dialog-header">
            <div><span className="resource-eyebrow">{editing ? 'ACTUALIZAR INFORMACIÓN' : 'NUEVO REGISTRO'}</span><h2 id="resource-dialog-title">{editing ? `Editar ${title.toLocaleLowerCase()}` : `Crear ${title.toLocaleLowerCase().replace(/s$/, '')}`}</h2></div>
            <button className="resource-close" type="button" aria-label="Cerrar" onClick={closeDialog}>×</button>
          </div>
          <form className="resource-form" onSubmit={(event) => void submit(event)}>
            {fields.filter((field) => !(editing && field.createOnly)).map((field) => (
              <label className={`resource-field${field.type === 'textarea' ? ' resource-field-wide' : ''}`} key={field.name}>
                <span>{field.label}{field.required ? ' *' : ''}</span>
                {field.type === 'select' ? (
                  <select required={field.required} value={form[field.name] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>
                    {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea maxLength={500} rows={3} value={form[field.name] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />
                ) : (
                  <input
                    autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                    required={field.required}
                    minLength={field.minLength}
                    type={field.type ?? 'text'}
                    min={field.type === 'number' ? field.min ?? 0 : undefined}
                    step={field.type === 'number' ? field.step : undefined}
                    value={form[field.name] ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                  />
                )}
              </label>
            ))}
            {saveError ? <div className="resource-alert resource-alert-form" role="alert">{saveError}</div> : null}
            <div className="resource-dialog-actions">
              <button className="resource-button" type="button" disabled={saving} onClick={closeDialog}>Cancelar</button>
              <button className="resource-button resource-button-primary" disabled={saving} type="submit">{saving ? 'Guardando...' : 'Guardar registro'}</button>
            </div>
          </form>
        </section>
      </div> : null}
    </div>
  );
}
