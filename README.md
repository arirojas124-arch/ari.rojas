# ARI ERP

Sistema ERP modular y multiempresa para web y móvil.

## Estado actual

El proyecto está en transición de Fase 0 — Fundación técnica hacia Fase 1 — Diseño funcional y sistema visual ARI ERP.

Ya existe una base funcional de API con autenticación, usuarios, empresas, aislamiento por tenantId, validación, seguridad HTTP y MongoDB preparado. Web y móvil tienen una base ejecutable conectada al endpoint de salud.

## Stack
- React Native Web + Vite para web.
- Expo + React Native para móvil.
- Node.js + Express + TypeScript para API.
- MongoDB Atlas + Mongoose para persistencia.
- JWT + bcrypt para autenticación inicial.
- Zod para validación.
- Monolito modular; no se introducirán microservicios en el MVP.

## Próximas fases
1. Diseño funcional del ERP.
2. Design System y UI ARI ERP.
3. App Shell: sidebar, header, rutas y estados.
4. Seguridad: sesiones, refresh tokens, permisos configurables y auditoría.
5. Clientes, proveedores, productos e inventario.
6. Ventas y compras.
7. Finanzas.
8. Dashboard con métricas reales.
9. Recursos humanos y proyectos.
10. Reportes.
11. Aplicación móvil MVP.
12. Pruebas y producción.

## Desarrollo

npm install
npm run typecheck
npm run build:api
npm run dev:api

API por defecto: puerto 4000.

## Salud
- GET /health: proceso HTTP activo.
- GET /ready: API y MongoDB listos para recibir tráfico.

## Seguridad
Las rutas empresariales deben obtener tenantId desde la sesión autenticada. El cliente no puede elegir libremente el tenant para acceder a información empresarial.
Los secretos reales y la URI de MongoDB Atlas nunca deben subirse a Git.