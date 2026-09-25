# Roadmap ARI ERP

## Fase 0 — Fundación técnica
- [x] Monorepo web/mobile/API.
- [x] TypeScript.
- [x] API REST versionada.
- [x] Validación Zod.
- [x] Helmet y CORS.
- [x] Autenticación JWT inicial.
- [x] Refresh token con rotación y revocación.
- [x] Aislamiento inicial por tenantId.
- [x] Auditoría base.
- [x] Health y readiness.
- [x] CI de typecheck/build.
- [ ] Conexión real y pruebas contra MongoDB Atlas.

## Fase 1 — Diseño funcional
- [ ] Definir procesos por módulo.
- [ ] Definir permisos por operación.
- [ ] Definir estados y transiciones.
- [ ] Definir DTOs y contratos compartidos.

## Fase 2 — UI
- [x] Shell inicial ARI ERP.
- [x] Sidebar y navegación base.
- [x] Dashboard visual inicial.
- [ ] Design tokens compartidos como paquete.
- [ ] Componentes reutilizables.
- [ ] Responsive móvil/tablet/desktop.

## Fase 3 — Core ERP
- [ ] Clientes.
- [ ] Proveedores.
- [ ] Categorías.
- [ ] Productos/servicios.
- [ ] Inventario.
- [ ] Movimientos de inventario.

## Fase 4 — Operación
- [ ] Ventas.
- [ ] Compras.
- [ ] Pagos.
- [ ] Reglas transaccionales.
- [ ] Auditoría de operaciones.

## Fase 5 — Finanzas y análisis
- [ ] Ingresos/egresos.
- [ ] Resúmenes.
- [ ] Endpoints agregados del dashboard.
- [ ] Reportes.

## Fase 6 — Recursos
- [ ] Empleados.
- [ ] Proyectos.
- [ ] Tareas.

## Fase 7 — Mobile
- [ ] Sesión segura.
- [ ] Dashboard.
- [ ] Clientes.
- [ ] Inventario.
- [ ] Ventas.
- [ ] Notificaciones.

## Fase 8 — Calidad y producción
- [ ] Pruebas unitarias.
- [ ] Pruebas de integración.
- [ ] Pruebas de aislamiento multiempresa.
- [ ] Pruebas E2E.
- [ ] Observabilidad.
- [ ] Backups y recuperación.
- [ ] Despliegue.
