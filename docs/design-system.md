# Design system ARI ERP

Tokens centralizados en `packages/ui/src/tokens`:

- `colors.ts`: marca verde profunda, acento terracota, superficies, texto y estados.
- `typography.ts`: familia DM Sans y escalas tipográficas.
- `spacing.ts`: escala de espaciado y breakpoints.
- `radius.ts`: radios compactos y consistentes.
- `shadows.ts`: elevación sutil para superficies y diálogos.

Primitives disponibles: Button, Input, Select, Checkbox, Toggle, Badge, StatusBadge, Card, ChartCard, Dialog, Dropdown, Tabs, DataTable con búsqueda/orden/paginación/selección/acciones/estados, SearchInput, EmptyState, LoadingState, Skeleton, ErrorState, Toast, Tooltip, Avatar, PageHeader y Breadcrumbs.

El selector de fecha queda pendiente de decidir su implementación por plataforma: no se reemplaza con un input de texto ni se fuerza un control exclusivamente web al paquete compartido. El gráfico real queda para UI-03, sujeto a endpoint, escala/periodo y datos disponibles.
