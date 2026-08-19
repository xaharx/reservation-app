# ORA DE NUIT API

Production-oriented Node.js/Express backend foundation for the ORA DE NUIT Flutter application.

## Quick start

1. Copy `.env.example` to `.env` and set a valid MySQL 8 `DATABASE_URL`.
2. Run `npm install`.
3. Generate Prisma Client with `npm run prisma:generate`.
4. Start locally with `npm run dev`.

Endpoints:

- `GET /api/v1/health`
- Swagger UI: `/api-docs`

## Architectural boundaries

- **Routes** own HTTP endpoint composition.
- **Controllers** translate HTTP requests/responses only.
- **Services** will hold business use cases.
- **Repositories** will isolate Prisma persistence operations.
- **Validators** will validate request contracts using Zod.
- **Middlewares** cover cross-cutting HTTP concerns.
- **config** centralizes environment, logging, and infrastructure setup.

No business APIs or domain models are included in this foundation.
