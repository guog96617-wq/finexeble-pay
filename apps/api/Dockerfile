FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter api... --frozen-lockfile=false

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /root/.cache /root/.cache
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter api prisma:generate && pnpm --filter api build

FROM node:20-alpine
WORKDIR /app/apps/api
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
