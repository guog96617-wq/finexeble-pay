# PROJECT STATUS

## 2026-06-02

### Step 1 - Scan current project structure
Status: Completed

- Project is a pnpm monorepo at `C:\Users\lele\Desktop\AI项目\支付pay`.
- Main apps present: `apps/web` and `apps/api`.
- Root contains `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `railway.toml`, Docker-related files, tests, and existing `node_modules`.
- `PROJECT_STATUS.md` did not exist, so this file was created to track the deployment work.

### Step 2 - Check `railway.toml`
Status: Completed

- Root `railway.toml` exists and currently uses Dockerfile builder.
- Current `dockerfilePath` is `apps/api/Dockerfile`, which is suspicious for the Web service deployment.
- Root `railway.toml` deploy command is API-oriented: `node scripts/railway-start.js`, healthcheck `/docs`.
- If Railway Web service uses the monorepo root as its service root, this root config would make Web build/deploy use the API Dockerfile and API start/healthcheck.

### Step 3 - Check `apps/web/Dockerfile`
Status: Completed

- `apps/web/Dockerfile` exists and is written for monorepo root build context.
- It copies root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and `apps/web/package.json`, then runs `pnpm install --filter web...`.
- Runtime starts Next.js on `${PORT:-3000}` and binds to `${HOSTNAME:-0.0.0.0}`.
- Local validation passed: `docker build -f apps/web/Dockerfile -t fxpay-web-railway-check .`.
- Build produced a Next.js 15 production bundle successfully.

### Step 4 - Check Railway Web Service configuration
Status: Completed with CLI auth limitation

- Railway CLI is installed (`railway 4.66.0`).
- Railway CLI auth has been restored.
- Based on Railway monorepo behavior, Web service should use:
  - Root Directory: repo root (`/`)
  - Config File: `/apps/web/railway.toml`
  - Dockerfile Path: `apps/web/Dockerfile`
- `apps/web/railway.toml` was updated so its Dockerfile path matches repo-root build context.
- Railway Web service was still failing because the root `railway.toml` applied API config globally:
  - Build logs showed `apps/api/Dockerfile`.
  - Healthcheck path was `/docs`.
- Root `railway.toml` was removed so API/Web services use their Railway service-specific settings instead of a single API-only root config.

### Step 5 - Continue Web deployment
Status: Completed as far as local/GitHub access allows

- Local Web image build is complete.
- Next step: run the built image locally and verify the HTTP response.
- Runtime validation passed:
  - Container started from `fxpay-web-railway-check`.
  - `GET http://localhost:3010/` returned HTTP 200.
  - Container logs show Next.js ready on `0.0.0.0:3000`.
- Re-ran Docker build after config update; build still passes.
- Committed deployment fix: `f738ec3 fix railway web monorepo docker config`.
- Pushed `master` to GitHub successfully.
- `origin/master` now matches local `HEAD`.
- Public Web URL check returned HTTP 200: `https://web-production-70ac7.up.railway.app/`.
- Public API docs check returned HTTP 200: `https://api-production-777b.up.railway.app/docs`.
- Railway dashboard/CLI deployment status could not be confirmed because the local Railway CLI token is expired.

### Final Output
Status: Ready

- Root cause: Railway Web deployment was using an app-local/incorrect Docker build context or API-oriented Railway config, while the restored Web Dockerfile requires the monorepo root as Docker build context.
- Fix: Web Dockerfile now builds from monorepo root; `apps/web/railway.toml` now points to `apps/web/Dockerfile`; local Docker build and runtime checks pass; fixes were pushed to GitHub.
- Current online Web address: `https://web-production-70ac7.up.railway.app/`.
- Recommended next step: refresh Railway CLI login or open Railway dashboard to confirm Web service uses Root Directory `/`, Config File `/apps/web/railway.toml`, and that the latest deployment from commit `f738ec3` completed.
- After Railway auth was restored, Web failure logs confirmed the root `railway.toml` was still applying API Dockerfile settings to the Web service. Root `railway.toml` was deleted to remove that global override.
