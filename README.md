# Embi Metrics Dashboard

React + TypeScript (Vite) frontend y proxy Node.js (Express) para la API de métricas Embi.

## Requisitos

- Node.js 20+
- URL base de la API Embi y token JWT

## Configuración

1. Edita [`backend/.env`](backend/.env) y pon `API_BASE_URL` con el host real (sin barra final).
2. Si tu usuario es super admin y necesitas `tenant_id`, descomenta y rellena `TENANT_ID` en `.env`.

## Ejecución

Terminal 1 — backend (puerto 3001):

```bash
cd backend && npm run dev
```

Terminal 2 — frontend (Vite proxy `/api` → backend):

```bash
cd frontend && npm run dev
```

Abre la URL que muestre Vite (normalmente `http://localhost:5173`).

## Qué muestra

- **Gráfico:** revenue, cost y profit diarios (últimos 30 días) vía `GET /api/metrics/aggregated?groupBy=date`.
- **Tablas:** top 10 publishers y ad units por variación absoluta de revenue entre anteayer y ayer (`GET /api/metrics` con `groupBy`).

El JWT no se expone al navegador; solo el backend llama a la API externa.
# daily
