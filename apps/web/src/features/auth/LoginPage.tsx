import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Button, Input } from '@ari-erp/ui';
import { login } from '../../services/auth.service.js';
import './login.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin() {
    setError('');

    if (!tenantId.trim() || !email.trim() || !password) {
      setError('Completa el ID de empresa, el correo y la contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ tenantId: tenantId.trim(), email: email.trim(), password });
      const destination = typeof location.state?.from === 'string' ? location.state.from : '/dashboard';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitLogin();
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Identidad ARI ERP">
        <Link className="login-brand" to="/login" aria-label="ARI ERP, inicio de sesión">
          <span className="login-brand-mark">A</span><span>ARI <b>ERP</b></span>
        </Link>
        <div className="login-brand-message">
          <span className="login-kicker">GESTIÓN CLARA</span>
          <h1>Todo lo importante de tu empresa, en un solo lugar.</h1>
          <p>Una base operativa para tomar decisiones con información real, permisos claros y procesos conectados.</p>
        </div>
        <div className="login-brand-footer"><ShieldCheck size={15} /> Acceso protegido por la API de ARI ERP</div>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="login-form-wrap">
          <div className="login-form-heading"><span className="login-form-icon"><LockKeyhole size={18} /></span><span className="login-kicker">ACCESO AL SISTEMA</span><h2 id="login-title">Bienvenido de nuevo</h2><p>Ingresa con las credenciales de tu empresa.</p></div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field-with-icon"><Building2 size={17} aria-hidden="true" /><Input label="ID de empresa" value={tenantId} onChangeText={setTenantId} placeholder="Ej. 64f..." autoComplete="organization" /></div>
            <div className="login-field-with-icon"><Mail size={17} aria-hidden="true" /><Input label="Correo electrónico" value={email} onChangeText={setEmail} placeholder="tu@empresa.com" autoComplete="email" keyboardType="email-address" autoCapitalize="none" /></div>
            <div className="login-field-with-icon"><LockKeyhole size={17} aria-hidden="true" /><Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="Tu contraseña" autoComplete="current-password" secureTextEntry /></div>
            {error ? <div className="login-error" role="alert">{error}</div> : null}
            <Button accessibilityLabel="Iniciar sesión" disabled={isSubmitting} onPress={() => void submitLogin()} style={{ marginTop: 6 }} variant="primary">{isSubmitting ? 'Validando acceso...' : <>Iniciar sesión <ArrowRight size={16} /></>}</Button>
          </form>
          <p className="login-switch">¿Aún no tienes una cuenta? <Link to="/register">Crea tu empresa</Link></p>
          <p className="login-help">El ID de empresa se obtiene durante el registro o desde el administrador de tu organización.</p>
        </div>
      </section>
    </main>
  );
}
