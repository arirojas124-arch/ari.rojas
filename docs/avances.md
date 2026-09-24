# Avances

## Fase 0 - Análisis del entorno

**Estado:** completada; la Fase 1 y la preparación técnica inicial están en progreso.

### Completado

- Se verificó que la carpeta de trabajo estaba vacía.
- Se confirmó que no existen código, módulos, configuración ni pruebas previas.
- Se comprobó que `git`, `node`, `npm` y `npx` no están disponibles en la terminal.
- Se documentaron los requisitos externos de MongoDB Atlas y la estrategia inicial por fases.
- Se creó la documentación inicial y plantillas de seguridad sin credenciales reales.
- Se instalaron Node.js `24.19.0` y Git `2.55.0.3` mediante `winget`.
- Se inicializó el repositorio Git y el workspace npm.
- Se creó la base TypeScript de `apps/api` y `packages/shared`.
- Se implementó y compiló `GET /health` como comprobación real de la API.
- Se documentaron arquitectura, modelo de datos y contrato inicial de API.
- Se creó la aplicación web inicial con React Native Web y Vite.
- La aplicación web consulta `/health` mediante una acción real y muestra el estado de la API.
- Se creó la base móvil Expo SDK 57 y se sustituyó la pantalla de ejemplo por una comprobación real de la API.
- Se consolidó el control de versiones en el repositorio raíz y se eliminó el Git anidado generado por Expo.
- Se implementó la primera vertical autenticada: registro, login, JWT, bcrypt, `/me` protegido y modelos Mongoose de empresa/usuario.
- Se añadió conexión MongoDB explícita, con estado no configurado cuando no existe `MONGODB_URI`.
- Se añadió manejo centralizado de errores de validación y errores internos.
- Se añadieron permisos derivados por rol, middleware `requirePermission` y rate limiting de login.
- Se normalizó el correo electrónico en registro y login para mantener consistente la autenticación con el índice único por empresa.
- Se añadieron los módulos iniciales de empresas y usuarios, con rutas protegidas, validación y filtros por `tenantId`.
- Se ampliaron los datos de empresa con dirección y teléfono editables por usuarios autorizados.
- Se corrigió la carga de variables para que la API encuentre `.env` local o el `.env` raíz del workspace.

### Pendiente

- Confirmar configuración de MongoDB Atlas.
- Verificar instalación nativa de Expo y dispositivos de prueba.
- Completar roles, permisos y pruebas de aislamiento multiempresa.
- Configurar MongoDB Atlas para probar registro y login con persistencia real.
- Persistir roles y permisos configurables por empresa.
- Añadir pruebas automatizadas de registro/login cuando exista una base MongoDB de pruebas.
- Crear pruebas de persistencia para empresas y usuarios, incluido el aislamiento entre empresas.
- Reemplazar los marcadores de la URI de Atlas y validar una conexión real.

### Pruebas ejecutadas

- Inspección de archivos: carpeta vacía.
- Resolución de herramientas: `git`, `node`, `npm` y `npx` no encontrados.
- Typecheck de API y paquete compartido: correcto.
- Compilación de la API: correcta.
- Prueba HTTP temporal de `/health`: HTTP `200`, estado `ok`.
- Auditoría npm: 0 vulnerabilidades reportadas.
- Typecheck web: correcto.
- Build web con Vite: correcto; se generó `apps/web/dist/index.html`.
- Typecheck móvil: correcto después de alinear su `tsconfig` con el workspace.
- Typecheck y compilación directa de la API autenticada: correctos.
- Prueba HTTP de `/api/v1/auth/me` sin token: HTTP `401 UNAUTHENTICATED`.
- Prueba de rate limiting: el intento 11 de login devuelve HTTP `429 RATE_LIMITED`.
- Typecheck y build de la API después de normalizar correos: correctos.
- Typecheck y build de la API después de añadir empresas y usuarios: correctos.
- La prueba de conexión detectó `EBADNAME` en `_mongodb._tcp.<cluster>`; la URI todavía usa el marcador de clúster y no se considera conectada.

Todavía no se ejecutaron registro/login contra MongoDB ni pruebas de aislamiento entre empresas porque Atlas aún no está configurado.
