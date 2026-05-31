# Global Payment Hub Starter V1.1

A lightweight global payment aggregation operations platform starter.

## Project Structure

```text
apps/
  api/      NestJS API, Prisma schema, seed data, Swagger
  web/      Next.js dashboard and public site
infra/
  nginx/    Reverse proxy config
docker-compose.yml
pnpm-workspace.yaml
```

## Modules

- Public SaaS website
- Super Admin console
- Merchant center
- Agent center
- PSP supplier and channel management
- Payment order creation with primary/backup routing
- Wallet balance, ledger, withdrawal review
- API keys, webhook configuration and logs
- SDK and plugin center
- Audit logging and security helpers

## Windows Quick Start

Prerequisites:

- Install Node.js 20 or newer.
- Install Docker Desktop and make sure `docker compose version` works in PowerShell.
- Use `corepack.cmd` on Windows if `pnpm` is not available directly.

First-time setup:

```powershell
cd "C:\Users\lele\Desktop\AI项目\支付pay"
corepack.cmd pnpm --version
corepack.cmd pnpm install
Copy-Item .env.example .env -Force
Copy-Item apps\api\.env.example apps\api\.env -Force
```

Start infrastructure:

```powershell
docker compose up postgres redis -d
```

Prepare database:

```powershell
corepack.cmd pnpm db:generate
corepack.cmd pnpm db:migrate
corepack.cmd pnpm db:seed
```

Start apps locally:

```powershell
corepack.cmd pnpm --filter api dev
corepack.cmd pnpm --filter web dev
```

Local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/docs`

Docker Compose full stack:

```powershell
docker compose up --build
```

If Docker on Windows reports a BuildKit/gRPC session error, use classic build mode:

```powershell
$env:DOCKER_BUILDKIT="0"
docker compose up --build
```

Docker URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/docs`
- Nginx gateway: `http://localhost:8080`

## Demo Accounts

```text
Super Admin: admin@payhub.local / Admin123!
Agent Admin: agent@payhub.local / Agent123!
Merchant Admin: merchant@payhub.local / Merchant123!
```

## API Signature

Merchant API requests should include:

```text
X-API-KEY
X-TIMESTAMP
X-NONCE
X-SIGNATURE
```

Signature payload:

```text
HMAC_SHA256(apiSecret, timestamp + nonce + body)
```

Create payment test data:

```text
API key: pk_demo_global_shop
API secret: sk_demo_global_shop_secret
```

Create a signed order request to:

```http
POST http://localhost:4000/api/v1/payments/create
```

with body:

```json
{
  "merchantOrderNo": "M202600002",
  "amount": "100.00",
  "currency": "USD",
  "customerEmail": "buyer@example.com"
}
```

## Verification Checklist

Run these after dependencies are installed:

```powershell
corepack.cmd pnpm --filter api build
corepack.cmd pnpm --filter web build
corepack.cmd pnpm --filter api prisma:validate
docker compose version
docker compose up postgres redis -d
corepack.cmd pnpm db:migrate
corepack.cmd pnpm db:seed
corepack.cmd pnpm --filter api dev
corepack.cmd pnpm --filter web dev
```

If `pnpm db:migrate`, `pnpm db:seed`, login, or order creation fails with `Can't reach database server at localhost:5432`, PostgreSQL is not running yet. Start Docker Desktop, then run `docker compose up postgres redis -d`.

If `docker` is not recognized, install Docker Desktop or add Docker to PATH, then reopen PowerShell.

## Notes

This starter uses a mock PSP adapter for payment links. Replace `PaymentRouterService` with real provider adapters when onboarding production channels.
