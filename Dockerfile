# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source and build
COPY . .
RUN pnpm run build

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Only install production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile 2>/dev/null || pnpm install --prod

# Copy built assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle ./drizzle

# Non-root user for security
RUN addgroup -S thynx && adduser -S thynx -G thynx
USER thynx

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/index.js"]
