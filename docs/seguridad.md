# Seguridad inicial

## Autenticación

- Las contraseñas se almacenan con bcrypt y factor de costo 12.
- Los tokens de acceso son JWT de corta duración.
- El contexto de empresa (`tenantId`) se firma dentro del token y se verifica en cada ruta privada.
- Las solicitudes sin token o con claims inválidos reciben `401`.

## Autorización

Los permisos se asignan en el servidor mediante `permissionsForRole` y se verifican con `requirePermission`. El frontend no decide el acceso. Los roles iniciales son `superadmin`, `company_admin`, `manager`, `employee` y `viewer`.

## Limitación de intentos

El endpoint de login limita a 10 intentos por IP en una ventana de 15 minutos. Esta implementación en memoria es adecuada para desarrollo de una sola instancia; antes de producción debe trasladarse a Redis o a un almacén distribuido.

## Persistencia

MongoDB solo se conecta cuando existe `MONGODB_URI`. No se almacenan credenciales reales en el repositorio y no se considera Atlas configurado hasta comprobar una conexión real.

## Pendientes antes de producción

- Refresh tokens rotativos y revocación de sesiones.
- Rate limiting distribuido.
- Roles y permisos configurables persistidos por empresa.
- Pruebas de aislamiento con dos tenants reales.
- Rotación y gestión externa de secretos.
