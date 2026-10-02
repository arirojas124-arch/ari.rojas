# Arquitectura frontend

- `apps/web/src/layout`: shell empresarial web.
- `apps/web/src/navigation`: rutas y catálogo de módulos.
- `apps/web/src/features`: composición por feature.
- `packages/ui`: tokens y primitives React Native reutilizables en web y móvil.
- `apps/web/src/styles.css` y hojas por layout/feature: adaptación visual propia de web.

No existe todavía cliente de autenticación ni sesión frontend. La pantalla indica el estado de sesión como no iniciado y no simula usuario, empresa, métricas ni actividad.
