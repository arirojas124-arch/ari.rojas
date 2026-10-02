const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const sessionKey = 'ari-erp-session';

export type AuthSession = {
  userId: string;
  tenantId: string;
  accessToken: string;
};

type ApiErrorBody = { error?: { message?: string } };

function readSession(): AuthSession | null {
  const raw = sessionStorage.getItem(sessionKey);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (session.userId && session.tenantId && session.accessToken) return session;
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

async function parseResponse(response: Response) {
  const body = await response.json().catch(() => ({})) as ApiErrorBody;
  if (!response.ok) {
    throw new Error(body.error?.message ?? 'No se pudo completar la solicitud.');
  }
  return body;
}

export async function login(input: { tenantId: string; email: string; password: string }) {
  const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  });
  const body = await parseResponse(response) as { data: AuthSession };
  sessionStorage.setItem(sessionKey, JSON.stringify(body.data));
  return body.data;
}

export async function register(input: { companyName: string; companySlug: string; name: string; email: string; password: string }) {
  const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  });
  const body = await parseResponse(response) as { data: AuthSession };
  sessionStorage.setItem(sessionKey, JSON.stringify(body.data));
  return body.data;
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
    headers: { authorization: `Bearer ${token}` }
  });
  return parseResponse(response) as Promise<{ data: { userId: string; tenantId: string; role: string; permissions: string[] } }>;
}
