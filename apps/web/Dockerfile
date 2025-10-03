# Simple Next.js build
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN corepack enable pnpm && pnpm i --no-frozen-lockfile

# Copy workspace files
COPY ../../package.json ../../pnpm-workspace.yaml ../../turbo.json ./
COPY ../../packages ./packages
COPY . .

# Build the application
RUN corepack enable pnpm && pnpm run build

# Simple runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV development

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=base --chown=nextjs:nodejs /app/apps/web/.next ./.next
COPY --from=base --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=base --chown=nextjs:nodejs /app/apps/web/package.json ./package.json
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "run", "dev"]
