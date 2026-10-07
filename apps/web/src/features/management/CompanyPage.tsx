import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '@ari-erp/ui';
import { getCurrentUser, getSession } from '../../services/auth.service.js';
import { getRecord, updateRecord } from '../../services/management.service.js';
import './resource-page.css';

type Company = {
  _id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
};

export function CompanyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getCurrentUser(session.accessToken)
      .then(({ data }) => setCanWrite(data.permissions.includes('companies:write')))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron validar permisos.'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getRecord<Company>('/companies/me')
      .then((data) => {
        if (cancelled) return;
        setCompany(data);
        setForm({ name: data.name, address: data.address ?? '', phone: data.phone ?? '' });
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : 'No se pudo cargar la empresa.';
        if (message.includes('sesión caducó')) navigate('/login', { replace: true, state: { from: location.pathname } });
        else if (!cancelled) setError(message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [location.pathname, navigate]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateRecord<Company>('/companies', 'me', form);
      setCompany(updated);
      setForm({ name: updated.name, address: updated.address ?? '', phone: updated.phone ?? '' });
      setSuccess('La información de la empresa se guardó correctamente.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la empresa.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="resource-page">
    <Breadcrumbs items={['Inicio', 'Empresa']} />
    <PageHeader eyebrow="CONFIGURACIÓN" title="Empresa" description="Consulta y actualiza la información de la empresa asociada a tu sesión." />
    <section className="resource-panel" aria-label="Datos de la empresa">
      {loading ? <p className="resource-message" role="status">Cargando empresa...</p> : company ? <form className="resource-form company-form" onSubmit={(event) => void save(event)}>
        <label className="resource-field"><span>Razón social *</span>
          <input required minLength={2} maxLength={120} readOnly={!canWrite} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label className="resource-field"><span>Identificador</span><input readOnly value={company.slug} /></label>
        <label className="resource-field resource-field-wide"><span>Dirección</span>
          <textarea maxLength={240} readOnly={!canWrite} rows={3} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
        </label>
        <label className="resource-field"><span>Teléfono</span>
          <input maxLength={40} readOnly={!canWrite} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        </label>
        {error ? <div className="resource-alert resource-alert-form" role="alert">{error}</div> : null}
        {success ? <p className="resource-message resource-alert-form" role="status">{success}</p> : null}
        {canWrite ? <div className="resource-dialog-actions">
          <button className="resource-button resource-button-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div> : null}
      </form> : !error ? <p className="resource-message">No se encontró información de la empresa.</p> : null}
      {error && !company ? <div className="resource-alert" role="alert">{error}</div> : null}
    </section>
  </div>;
}
