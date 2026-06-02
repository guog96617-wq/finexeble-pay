# Railway web image. Build context is the monorepo root.
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter web... --frozen-lockfile=false

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
ARG NEXT_PUBLIC_API_URL=https://api-production-777b.up.railway.app
ARG API_BASE_URL=https://api-production-777b.up.railway.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_BASE_URL=$API_BASE_URL
COPY --from=deps /root/.cache /root/.cache
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm --filter web build

FROM node:20-alpine
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NIXPACKS_PORT=3000
ENV NEXT_PUBLIC_API_URL=https://api-production-777b.up.railway.app
ENV API_BASE_URL=https://api-production-777b.up.railway.app
ENV PATH=/app/apps/web/node_modules/.bin:/app/node_modules/.bin:$PATH
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/package.json ./package.json
EXPOSE ${PORT}
CMD ["sh", "-c", "exec node_modules/.bin/next start -H ${HOSTNAME:-0.0.0.0} -p ${PORT:-3000}"]
