# Build stage - Install ALL dependencies including dev
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy packages
COPY packages ./packages

# Copy web app
COPY apps/web ./apps/web

# Install dependencies (THIS installs TypeScript!)
RUN pnpm install --frozen-lockfile

# Build packages first
WORKDIR /app
RUN pnpm --filter @rapbattles/core build
RUN pnpm --filter @rapbattles/ui build

# Build web app
RUN pnpm --filter @rapbattles/web build

# Runtime stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "./node_modules/.bin/next", "start"]