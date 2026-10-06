# Estado de implementación UI

## UI-01 - Design System

**Estado:** completada para el alcance de shell. Tokens y primitives están disponibles en `packages/ui`. El selector de fecha, tests visuales y variantes adicionales quedan como seguimiento; no bloquean UI-02.

## UI-02 - ERP Shell

**Estado:** completada para el alcance base. Sidebar responsive, drawer móvil, topbar, búsqueda local de módulos, navegación al dashboard y marcador de salud real de API. Empresa y sesión se muestran como no configuradas.

## UI-03 - Dashboard funcional

**Estado:** pendiente. La pantalla actual es un estado vacío explícito; no hay KPIs ni datos falsos.

## UI-04 - Autenticación web

**Estado:** login y creación de cuenta implementados. `/login` consume `POST /api/v1/auth/login` y `/register` consume `POST /api/v1/auth/register`; la sesión se guarda temporalmente en `sessionStorage` y el usuario es redirigido al dashboard.

La prueba de alta contra MongoDB queda pendiente porque Atlas todavía no está configurado.

## Módulos operativos iniciales

- Usuarios: listado por empresa, creación con contraseña, edición de nombre/rol y activación/desactivación.
- Clientes: listado, alta, edición y activación/desactivación.
- Productos: listado, alta, edición de SKU/precio/existencia y activación/desactivación.
- Los endpoints mantienen aislamiento por empresa (`tenantId`) y verifican permisos del token.
- La sesión renueva automáticamente el token de acceso mientras el token de renovación siga vigente; las sesiones antiguas deberán iniciar sesión una vez para obtenerlo.
- Ventas: registro transaccional con cliente, productos y existencias; el folio y los importes se guardan como snapshot.
- Facturas: se generan automáticamente como documentos internos no fiscales; su estado de pago se puede actualizar.
- Reportes: ventas totales, promedio, pagos pendientes/pagados, productos principales y ventas diarias, con filtros y exportación CSV.
- Compras, inventario/movimientos independientes y el resto de módulos continúan pendientes.

## Validación

- Typecheck web: correcto.
- Build web: correcto.
- Build API: correcto.
- Las nuevas escrituras de venta e inventario se confirman juntas en una transacción MongoDB.
- Typecheck de web y `packages/ui`: correcto.
- Revisión en navegador a 390 px y 1440 px: sin overflow horizontal.
- Drawer móvil: abre y cierra mediante su control interno.
- Buscador de módulos y popover de notificaciones: funcionales.
- Pendiente: auditoría completa de accesibilidad y pruebas automatizadas de componentes.
- Pendiente preexistente fuera de UI-01/UI-02: `npm run typecheck --workspace mobile` falla al resolver `expo` desde `apps/mobile/index.ts`.
