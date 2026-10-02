import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, getSession } from '../services/auth.service.js';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setStatus('unauthenticated');
      return;
    }

    getCurrentUser(session.accessToken)
      .then(() => setStatus('authenticated'))
      .catch(() => {
        sessionStorage.removeItem('ari-erp-session');
        setStatus('unauthenticated');
      });
  }, []);

  if (status === 'checking') return <main className="route-loading" aria-live="polite">Comprobando sesión...</main>;
  if (status === 'unauthenticated') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
