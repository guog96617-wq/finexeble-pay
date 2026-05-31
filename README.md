# Finexeble FXpay V1.2

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
railway.toml
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

Demo API key:

```text
pk_demo_global_shop
```

The API secret is intentionally not printed in the README or UI. Set `DEMO_API_SECRET` in your local `.env` before running seed data, then use that value for signed local API tests.

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

## Public Deployment Guide

This repo is prepared for a split deployment:

- GitHub: source repository
- Neon PostgreSQL: production Postgres
- Upstash Redis: production Redis
- Railway API: NestJS API from `apps/api/Dockerfile`
- Vercel Web: Next.js web app from `apps/web`

### 1. GitHub

Push the repository to GitHub. Do not commit `.env`, `node_modules`, `.next`, `dist`, or database volumes. These are already ignored.

### 2. Neon PostgreSQL

Create a Neon project and copy the pooled or direct PostgreSQL connection string.

Use it as:

```text
DATABASE_URL=postgresql://...
```

### 3. Upstash Redis

Create an Upstash Redis database and copy the Redis URL.

Use it as:

```text
REDIS_URL=rediss://...
```

### 4. Railway API

Create a Railway service from the GitHub repository.

Recommended Railway settings:

```text
Root Directory: repository root
Dockerfile Path: apps/api/Dockerfile
Config file: railway.toml
```

Required Railway environment variables:

```text
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
JWT_SECRET=<strong random secret, 32+ characters>
FRONTEND_URL=https://your-vercel-domain.vercel.app
CORS_ORIGIN=https://your-vercel-domain.vercel.app
DEMO_API_SECRET=<only if seeding demo data>
```

Run production database commands from a secure shell or Railway job:

```powershell
corepack pnpm --filter api prisma:generate
corepack pnpm --filter api prisma:migrate
corepack pnpm --filter api prisma:seed
```

Use seed only for demo environments. For production onboarding, create real merchants and secrets outside source control.

### 5. Vercel Web

Create a Vercel project from the same GitHub repository.

Recommended Vercel settings:

```text
Root Directory: apps/web
Framework Preset: Next.js
Install Command: cd ../.. && corepack enable && pnpm install --frozen-lockfile=false --filter web...
Build Command: cd ../.. && corepack enable && pnpm --filter web build
Output Directory: .next
```

These settings are also captured in `apps/web/vercel.json`.

Required Vercel environment variables:

```text
NEXT_PUBLIC_API_URL=https://your-railway-api-domain.up.railway.app
```

Optional server-side API override:

```text
API_BASE_URL=https://your-railway-api-domain.up.railway.app
```

### 6. Deployment Verification

After deploy, verify:

- Web: `https://your-vercel-domain.vercel.app`
- Login: `https://your-vercel-domain.vercel.app/login`
- Admin: `https://your-vercel-domain.vercel.app/admin`
- Merchant: `https://your-vercel-domain.vercel.app/merchant`
- Agent: `https://your-vercel-domain.vercel.app/agent`
- API: `https://your-railway-api-domain.up.railway.app/api`
- Swagger: `https://your-railway-api-domain.up.railway.app/docs`

## Verification

```powershell
corepack.cmd pnpm --filter web build
corepack.cmd pnpm --filter api build
corepack.cmd pnpm --filter api prisma:validate
docker compose ps
```

## Notes

This starter uses a mock PSP adapter for payment links. Replace `PaymentRouterService` with real provider adapters when onboarding production channels.
