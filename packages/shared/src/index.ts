export type TenantId = string;

export interface TenantScoped {
  tenantId: TenantId;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
