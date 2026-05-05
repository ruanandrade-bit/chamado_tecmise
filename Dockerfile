# ─── Frontend Dockerfile ─────────────────────────────────────────────
# Multi-stage build: Vite build → Nginx serve

# Stage 1: Build the frontend
FROM node:22-alpine AS builder
WORKDIR /app

# Copy only package.json (no lock file) to force fresh install
# This ensures rollup gets the correct native binding for musl/Alpine
COPY package.json ./
RUN npm install

COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY public ./public
COPY src ./src

# The API URL is baked in at build time via this arg
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS runner

# Custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
