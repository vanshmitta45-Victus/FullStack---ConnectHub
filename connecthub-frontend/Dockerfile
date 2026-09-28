# ============================================================================
# Stage 1: Build the Vite React Frontend
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source assets and build production distribution
COPY . .
RUN npm run build

# ============================================================================
# Stage 2: Serve Optimized Production Bundle via Nginx
# ============================================================================
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback and WebSocket proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
