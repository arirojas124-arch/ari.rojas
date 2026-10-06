import { authenticatedFetch } from './auth.service.js';

export type ManagedRecord = {
  _id: string;
  isActive?: boolean;
  [key: string]: unknown;
};

type ApiResponse<T> = { data: T; error?: { code?: string; message?: string } };

const errorMessages: Record<string, string> = {
  UNAUTHENTICATED: 'Tu sesión terminó. Inicia sesión de nuevo.',
  FORBIDDEN: 'Tu usuario no tiene permiso para realizar esta acción.',
  DATABASE_UNAVAILABLE: 'La base de datos no está disponible.',
  USER_EXISTS: 'Ya existe un usuario con ese correo en esta empresa.',
  PRODUCT_SKU_EXISTS: 'Ya existe un producto con ese código SKU.'
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await authenticatedFetch(path, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con la API. Verifica que el servicio esté publicado y disponible.');
    }
    throw error;
  }

  const body = await response.json().catch(() => ({})) as ApiResponse<T>;
  if (!response.ok) {
    const code = body.error?.code;
    throw new Error((code && errorMessages[code]) ?? body.error?.message ?? 'No se pudo completar la solicitud.');
  }
  return body.data;
}

export function listRecords<T extends ManagedRecord>(path: string) {
  return request<T[]>(path);
}

export function createRecord<T extends ManagedRecord>(path: string, input: Record<string, unknown>) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(input) });
}

export function updateRecord<T extends ManagedRecord>(path: string, id: string, input: Record<string, unknown>) {
  return request<T>(`${path}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
}
