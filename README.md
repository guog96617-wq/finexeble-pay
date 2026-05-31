# Finexeble FXpay V1.1

Finexeble / FXpay is a lightweight Global Payment Aggregator Platform demo. It shows the minimum payment operations loop for merchants, agents and administrators:

Login -> Create order -> PSP routing and failover -> Payment callback -> Wallet credit -> Withdraw request -> Admin review -> Webhook logs.

## Brand

- Product name: Finexeble
- Product short name: FXpay
- Positioning: Global Payment Aggregator Platform
- Style: light fintech SaaS, inspired by Stripe, Linear, Supabase Light, Mercury, Brex, Ramp and Coinbase Light dashboards.
- Logo assets:
  - `apps/web/public/brand/logo.png`
  - `apps/web/public/brand/logo-icon.png`
  - `apps/web/public/brand/og-image.png`
  - `apps/web/public/favicon.ico`
  - `apps/web/public/favicon.png`

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

## Windows Quick Start

Prerequisites:

- Install Node.js 20 or newer.
- Install Docker Desktop and keep it running.
- Open PowerShell.

First-time setup:

```powershell
cd "C:\Users\lele\Desktop\AI项目\支付pay"
corepack.cmd pnpm install
Copy-Item .env.example .env -Force
Copy-Item apps\api\.env.example apps\api\.env -Force
docker compose up postgres redis -d
corepack.cmd pnpm db:generate
corepack.cmd pnpm db:migrate
corepack.cmd pnpm db:seed
```

Start API and Web locally:

```powershell
corepack.cmd pnpm --filter api dev
corepack.cmd pnpm --filter web dev
```

Open:

- Web: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/docs`

## Docker Full Stack

```powershell
docker compose up --build
```

If Docker on Windows reports a BuildKit or gRPC session error:

```powershell
$env:DOCKER_BUILDKIT="0"
docker compose up --build
```

## Demo Accounts

```text
Super Admin: admin@payhub.local / Admin123!
Merchant:    merchant@payhub.local / Merchant123!
Agent:       agent@payhub.local / Agent123!
```

Role redirects:

- `SUPER_ADMIN` -> `/admin`
- `MERCHANT_ADMIN` -> `/merchant`
- `AGENT_ADMIN` -> `/agent`

## Core Test Flow

1. Open `http://localhost:3000/login`.
2. Login as merchant and confirm it redirects to `/merchant`.
3. Create a merchant order from Merchant Center.
4. Create a signed payment through `POST /api/v1/payments/create`.
5. Confirm payment attempts show primary failure and backup success.
6. Trigger `POST /api/webhooks/payment/notify` to simulate payment success.
7. Confirm merchant wallet balance increases.
8. Submit a withdraw request from Merchant Center.
9. Login as admin and review the withdraw request.
10. Click approve, then mark as paid.
11. Review webhook logs in Admin Console.

## API Signature

Merchant API requests include:

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

Demo credentials:

```text
API key: pk_demo_global_shop
API secret: sk_demo_global_shop_secret
```

Create payment endpoint:

```http
POST http://localhost:4000/api/v1/payments/create
```

Example body:

```json
{
  "merchantOrderNo": "M202600002",
  "amount": "100.00",
  "currency": "USD",
  "customerEmail": "buyer@example.com"
}
```

## Verification

```powershell
corepack.cmd pnpm --filter web build
corepack.cmd pnpm --filter api build
corepack.cmd pnpm --filter api prisma:validate
docker compose ps
```

## Notes

This starter uses a mock PSP adapter for payment links. Replace `PaymentRouterService` with real provider adapters when onboarding production channels.
