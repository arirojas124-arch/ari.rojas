import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Button, Input } from '@ari-erp/ui';
import { register } from '../../services/auth.service.js';
import './login.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegister() {
    setError('');
    if (!companyName.trim() || !companySlug.trim() || !name.trim() || !email.trim() || !password) {
      setError('Completa todos los campos para crear tu cuenta.');
      return;
    }
    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(companySlug.trim().toLowerCase())) {
      setError('El identificador de empresa solo puede contener letras minúsculas, números y guiones.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ companyName: companyName.trim(), companySlug: companySlug.trim().toLowerCase(), name: name.trim(), email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitRegister();
  }

  return (
    <main className="login-page register-page">
      <section className="login-brand-panel" aria-label="Identidad ARI ERP">
        <Link className="login-brand" to="/login" aria-label="ARI ERP, inicio de sesión"><span className="login-brand-mark">A</span><span>ARI <b>ERP</b></span></Link>
        <div className="login-brand-message"><span className="login-kicker">EMPIEZA CON ORDEN</span><h1>Una base clara para hacer crecer tu empresa.</h1><p>Configura tu empresa y entra a un espacio preparado para conectar personas, operaciones y decisiones.</p></div>
        <div className="login-brand-footer"><ShieldCheck size={15} /> Tus datos se gestionan desde la API de ARI ERP</div>
      </section>
      <section className="login-form-panel" aria-labelledby="register-title">
        <div className="login-form-wrap">
          <div className="login-form-heading"><span className="login-form-icon"><Building2 size={18} /></span><span className="login-kicker">NUEVA ORGANIZACIÓN</span><h2 id="register-title">Crea tu cuenta</h2><p>Registra tu empresa y el usuario administrador.</p></div>
          <form className="login-form register-form" onSubmit={handleSubmit}>
            <div className="login-field-with-icon"><Building2 size={17} aria-hidden="true" /><Input label="Nombre de la empresa" value={companyName} onChangeText={setCompanyName} placeholder="Mi empresa" autoComplete="organization" /></div>
            <div className="login-field-with-icon"><Building2 size={17} aria-hidden="true" /><Input label="Identificador de empresa" value={companySlug} onChangeText={setCompanySlug} placeholder="mi-empresa" autoCapitalize="none" /></div>
            <div className="login-field-with-icon"><UserRound size={17} aria-hidden="true" /><Input label="Tu nombre" value={name} onChangeText={setName} placeholder="Nombre completo" autoComplete="name" /></div>
            <div className="login-field-with-icon"><Mail size={17} aria-hidden="true" /><Input label="Correo electrónico" value={email} onChangeText={setEmail} placeholder="tu@empresa.com" autoComplete="email" keyboardType="email-address" autoCapitalize="none" /></div>
            <div className="login-field-with-icon"><LockKeyhole size={17} aria-hidden="true" /><Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 12 caracteres" autoComplete="new-password" secureTextEntry /></div>
            {error ? <div className="login-error" role="alert">{error}</div> : null}
            <Button accessibilityLabel="Crear cuenta" disabled={isSubmitting} onPress={() => void submitRegister()} style={{ marginTop: 6 }} variant="primary">{isSubmitting ? 'Creando organización...' : <>Crear cuenta <ArrowRight size={16} /></>}</Button>
          </form>
          <p className="login-switch">¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
          <p className="login-help">El identificador de empresa se utilizará junto con tu correo para iniciar sesión.</p>
        </div>
      </section>
    </main>
  );
}