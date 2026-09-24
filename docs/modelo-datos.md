# Modelo de datos inicial

Todas las entidades empresariales incluyen `tenantId`, `createdAt`, `updatedAt` y, cuando aplica, `isActive` para eliminación lógica.

| Colección | Propósito | Índices iniciales |
| --- | --- | --- |
| `companies` | Empresas y configuración general | `slug` único |
| `users` | Identidad y acceso | `email` único |
| `roles` | Roles por empresa | `{ tenantId, name }` único |
| `permissions` | Catálogo de permisos | `code` único |
| `customers` | Clientes | `{ tenantId, email }`, texto de búsqueda |
| `suppliers` | Proveedores | `{ tenantId, name }` |
| `products` | Productos y servicios | `{ tenantId, sku }` único |
| `categories` | Categorías | `{ tenantId, name }` único |
| `inventory` | Existencia por producto | `{ tenantId, productId }` único |
| `inventoryMovements` | Entradas, salidas y ajustes | `{ tenantId, productId, createdAt }` |
| `sales` | Encabezado y líneas de venta | `{ tenantId, createdAt }` |
| `purchases` | Encabezado y líneas de compra | `{ tenantId, createdAt }` |
| `financialTransactions` | Ingresos y egresos básicos | `{ tenantId, occurredAt }` |
| `employees` | Datos laborales básicos | `{ tenantId, employeeCode }` único |
| `projects` | Proyectos | `{ tenantId, status }` |
| `tasks` | Tareas y responsables | `{ tenantId, projectId, status }` |
| `auditLogs` | Operaciones relevantes | `{ tenantId, createdAt }` |

Las líneas de ventas y compras conservarán el precio o costo aplicado en el momento de la operación. Los totales serán calculados en el backend. Las referencias a entidades de otra empresa se rechazarán mediante consultas filtradas por `tenantId`.
