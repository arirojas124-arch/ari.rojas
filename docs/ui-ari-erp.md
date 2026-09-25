# UI ARI ERP

## Objetivo

La interfaz toma como referencia el dashboard proporcionado: sidebar lateral, encabezado limpio, tarjetas KPI, gráficas y actividad reciente. La referencia se adapta a procesos de ERP y no a gestión inmobiliaria.

## Principios

- Una jerarquía visual clara.
- Espaciado amplio y bordes suaves.
- Blanco y grises como base, con un color de acento limitado.
- Los KPI muestran datos reales o un estado explícito de "sin datos"; no se usan cifras ficticias.
- La navegación depende de los permisos del usuario.
- Web y móvil comparten lenguaje visual, pero no necesariamente la misma densidad de información.

## Componentes base

- AppShell
- Sidebar
- Header
- StatCard
- Card
- Table
- FormField
- Modal
- Badge
- EmptyState
- LoadingState
- ErrorState
- ChartCard

## Dashboard

El dashboard definitivo dependerá de los módulos de clientes, ventas, inventario y finanzas. Por eso la primera versión implementa la composición visual y estados vacíos; las métricas se conectarán a endpoints agregados después.

## Identidad

Marca principal: ARI ERP.

El elemento ":)" puede utilizarse como recurso secundario de identidad, pero no debe competir con la navegación ni con los datos.
