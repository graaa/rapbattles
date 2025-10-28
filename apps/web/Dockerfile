FROM node:18-alpine
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

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages
RUN pnpm --filter @rapbattles/core build
RUN pnpm --filter @rapbattles/ui build

# Expose port
EXPOSE 3000

# Start in dev mode (no build needed)
CMD ["pnpm", "--filter", "@rapbattles/web", "dev"]