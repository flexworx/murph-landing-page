# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline 2>/dev/null || npm install

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Only install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --prefer-offline 2>/dev/null || npm install --omit=dev

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
