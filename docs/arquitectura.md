# Arquitectura inicial

## Estilo

ERP Multigestión usará un monolito modular con API REST centralizada. La separación por módulos será interna al backend y no se introducirán microservicios en el MVP.

## Capas

- **API:** rutas versionadas, autenticación, autorización y respuestas HTTP.
- **Aplicación:** casos de uso y reglas de negocio.
- **Dominio:** entidades, permisos y contratos independientes del transporte.
- **Infraestructura:** Mongoose, MongoDB Atlas, hashing, configuración y auditoría.
- **Clientes:** React Native compartido entre web y móvil cuando el flujo sea equivalente.

## Aislamiento multiempresa

El contexto `tenantId` se derivará de la sesión autenticada y de las empresas autorizadas para el usuario. Las colecciones empresariales tendrán `tenantId` e índices compuestos; ningún `tenantId` enviado por el cliente será suficiente para autorizar acceso.

## Consistencia

Se usarán transacciones MongoDB para confirmar ventas con movimientos de inventario y para recibir compras actualizando existencias. El entorno debe ser un replica set, como los clústeres compatibles de Atlas.

## Seguridad

- Hash de contraseñas con Argon2id o bcrypt.
- Tokens de corta duración y rotación de refresh tokens.
- Validación con esquemas en la API.
- CORS por lista permitida.
- Rate limiting para autenticación.
- Errores normalizados sin filtrar secretos.
- Auditoría sin contraseñas, tokens ni credenciales.
