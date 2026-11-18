# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
ENV HUSKY=0 NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY .husky/install.mjs .husky/install.mjs
RUN --mount=type=cache,target=/root/.npm npm ci

FROM dependencies AS builder
COPY . .
# Match the production compiler verified by the local acceptance suite.
RUN mkdir -p public && npm run build -- --webpack

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    APP_ENV=production \
    DATA_PROVIDER=laravel \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
