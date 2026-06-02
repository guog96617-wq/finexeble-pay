FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:20-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=https://api-production-777b.up.railway.app
ARG API_BASE_URL=https://api-production-777b.up.railway.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_BASE_URL=$API_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NIXPACKS_PORT=3000
ENV NEXT_PUBLIC_API_URL=https://api-production-777b.up.railway.app
ENV API_BASE_URL=https://api-production-777b.up.railway.app
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
EXPOSE ${PORT}
CMD ["sh", "-c", "exec node_modules/.bin/next start -H ${HOSTNAME:-0.0.0.0} -p ${PORT:-3000}"]
