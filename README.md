# ERP Multigestión

Sistema ERP modular y multiempresa para web y móvil.

## Estado actual

La base de la API y la interfaz ARI ERP están en desarrollo. UI-01 (Design System inicial) y UI-02 (ERP Shell web) están implementadas; el dashboard aún no presenta métricas hasta contar con endpoints y datos reales.

Consulta [docs/avances.md](docs/avances.md), [docs/implementation-status.md](docs/implementation-status.md), [docs/ui-architecture.md](docs/ui-architecture.md) y [docs/design-system.md](docs/design-system.md).

## Requisitos previos

Requisitos:

- Node.js LTS y npm.
- Git.
- MongoDB Atlas o una instancia MongoDB compatible.
- Un proveedor de credenciales seguro para las variables de entorno locales.

No se incluyen credenciales reales en este repositorio.

## Desarrollo web

```sh
npm install
npm run dev --workspace @erp/web -- --host 0.0.0.0
```

La web utiliza `VITE_API_URL` para consultar el endpoint real de salud de la API. La autenticación web y los módulos empresariales siguen pendientes.
