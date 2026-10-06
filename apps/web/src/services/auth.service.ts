const apiUrl = import.meta.env.VITE_API_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
const sessionKey = 'ari-erp-session';

export type AuthSession = {
  userId: string;
  tenantId: string;
  accessToken: string;
  refreshToken: string;
};

type ApiErrorBody = { error?: { message?: string } };

function readSession(): AuthSession | null {
  const raw = sessionStorage.getItem(sessionKey);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (
      typeof session.userId === 'string'
      && typeof session.tenantId === 'string'
      && typeof session.accessToken === 'string'
      && typeof session.refreshToken === 'string'
    ) {
      return session;
    }
    sessionStorage.removeItem(sessionKey);
  } catch {
    sessionStorage.removeItem(sessionKey);
  }

  return null;
}

export function getSession() {
  return readSession();
}

export function clearSession() {
  sessionStorage.removeItem(sessionKey);
}

let refreshInProgress: Promise<AuthSession> | null = null;

export function refreshSession() {
  if (!refreshInProgress) {
    refreshInProgress = (async () => {
      const session = readSession();
      if (!session) {
        throw new Error('Tu sesión caducó. Inicia sesión de nuevo para continuar.');
      }

      let response: Response;
      try {
        response = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken })
        });
      } catch (error) {
        throw new Error(describeNetworkError(error));
      }

      if (response.status === 401) {
        clearSession();
        throw new Error('Tu sesión caducó. Inicia sesión de nuevo para continuar.');
      }

      const body = await parseResponse(response) as { data: AuthSession };
      sessionStorage.setItem(sessionKey, JSON.stringify(body.data));
      return body.data;
    })().finally(() => {
      refreshInProgress = null;
    });
  }

  return refreshInProgress;
}

export async function authenticatedFetch(path: string, options: RequestInit = {}) {
  let session = readSession();
  if (!session) {
    throw new Error('Tu sesión caducó. Inicia sesión de nuevo para continuar.');
  }

  const send = (accessToken: string) => {
    const headers = new Headers(options.headers);
    headers.set('authorization', `Bearer ${accessToken}`);
    if (options.body && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return fetch(`${apiUrl}/api/v1${path}`, { ...options, headers });
  };

  let response = await send(session.accessToken);
  if (response.status === 401) {
    session = await refreshSession();
    response = await send(session.accessToken);
  }
  return response;
}

async function parseResponse(response: Response) {
  const body = await response.json().catch(() => ({})) as ApiErrorBody;
  if (!response.ok) {
    throw new Error(body.error?.message ?? 'No se pudo completar la solicitud.');
  }
  return body;
}

function describeNetworkError(error: unknown) {
  if (error instanceof TypeError) {
    return 'No se pudo conectar con la API. Verifica que el backend esté en ejecución y que la URL de la API sea correcta.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'No se pudo completar la solicitud.';
}

export async function login(input: { tenantId: string; email: string; password: string }) {
  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    });
    const body = await parseResponse(response) as { data: AuthSession };
    sessionStorage.setItem(sessionKey, JSON.stringify(body.data));
    return body.data;
  } catch (error) {
    throw new Error(describeNetworkError(error));
  }
}

export async function register(input: { companyName: string; companySlug: string; name: string; email: string; password: string }) {
  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    });
    const body = await parseResponse(response) as { data: AuthSession };
    sessionStorage.setItem(sessionKey, JSON.stringify(body.data));
    return body.data;
  } catch (error) {
    throw new Error(describeNetworkError(error));
  }
}

export async function getCurrentUser(token: string) {
  const session = readSession();
  const response = session?.accessToken === token
    ? await authenticatedFetch('/auth/me')
    : await fetch(`${apiUrl}/api/v1/auth/me`, { headers: { authorization: `Bearer ${token}` } });
  return parseResponse(response) as Promise<{ data: { userId: string; tenantId: string; role: string; permissions: string[] } }>;
}
