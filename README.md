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

## Desarrollo

```sh
npm install
npm run dev
```

Esto levanta la API y la web al mismo tiempo. La web quedará disponible en `http://localhost:5173/login` y la API en `http://localhost:4000`.

Si necesitas arrancar solo uno de los servicios:

```sh
npm run dev:api
npm run dev:web
```

## Configuración para dominio y despliegue

Para producción, define la URL de la API en la web:

```sh
VITE_API_URL=https://api.tu-dominio.com
```

Y en la API, incluye los dominios permitidos:

```sh
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
```

En Cloudflare, crea un DNS `CNAME` o `A` apuntando al servicio de Render/Vercel y activa la proxy. Si aparece `522`, significa que Cloudflare no pudo llegar al servidor origen: revisa que el servicio esté activo, que el puerto sea el correcto y que el dominio esté apuntando al host correcto.

La web utiliza `VITE_API_URL` para comunicarse con la API. Login y registro están implementados; usuarios, clientes y productos cuentan con listados y altas/edición ligados a MongoDB. Ventas y los demás módulos continúan pendientes y se habilitarán por fases.
