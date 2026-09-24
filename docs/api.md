# API REST

La API se versionará bajo `/api/v1`. En la fase inicial solo está disponible el endpoint técnico:

- `GET /health`: comprueba que el proceso HTTP está activo.
- `POST /api/v1/auth/register`: crea una empresa y su administrador inicial. Requiere MongoDB.
- `POST /api/v1/auth/login`: autentica un usuario dentro de su `tenantId`. Requiere MongoDB.
- `GET /api/v1/auth/me`: devuelve el contexto autenticado; requiere `Authorization: Bearer <token>`.
- `GET /api/v1/companies/me`: consulta la empresa del token autenticado; requiere `companies:read`.
- `PATCH /api/v1/companies/me`: actualiza nombre, dirección o teléfono; requiere `companies:write`.
- `GET /api/v1/users`: lista los usuarios de la empresa del token; requiere `users:read`.
- `POST /api/v1/users`: crea un usuario dentro de la empresa del token; requiere `users:write`.
- `PATCH /api/v1/users/:userId`: actualiza nombre, rol o estado activo dentro de la empresa del token; requiere `users:write`.

Las rutas privadas derivan `tenantId` de los claims verificados del token. El `tenantId` enviado por el cliente solo se usa como criterio de inicio de sesión y nunca sustituye la autorización de sesión.
Los permisos iniciales se derivan del rol del usuario en el servidor. El login tiene un límite de 10 intentos por IP cada 15 minutos; el intento siguiente devuelve `429 RATE_LIMITED`.

Los módulos empresariales no se publicarán como terminados hasta contar con persistencia, validación, autorización, pruebas y aislamiento multiempresa. La especificación OpenAPI se añadirá junto con la primera versión autenticada de la API.
