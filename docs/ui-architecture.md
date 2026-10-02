# Arquitectura UI

La aplicación web compone `ERPLayout` (sidebar, topbar y área de página) con rutas gestionadas por React Router. Las rutas implementadas se limitan a `/dashboard`; los módulos aún no implementados aparecen deshabilitados y no crean rutas ficticias.

El sidebar se alimenta desde `apps/web/src/navigation/modules.ts`. Cada entrada declara disponibilidad y permiso previsto. La visibilidad futura dependerá de la sesión, mientras que la autorización efectiva continuará siendo responsabilidad de la API.

Los componentes de interfaz multiplataforma viven en `packages/ui` y usan React Native primitives. Los elementos propios del navegador (rutas, enlaces y popovers de navegación) permanecen en `apps/web`.
