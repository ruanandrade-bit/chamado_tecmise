# ─── Backend Dockerfile ──────────────────────────────────────────────
# Multi-stage build for smaller final image

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Create data directory with proper permissions (for JSON fallback)
RUN mkdir -p /app/src/data && chown -R backend:nodejs /app/src/data

USER backend

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "src/server.js"]
