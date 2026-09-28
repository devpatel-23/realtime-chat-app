# Multi-stage Dockerfile for Real-time Chat Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native compilation (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/chat.db

# Install build tools for native compilation if required
RUN apk add --no-cache python3 make g++

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Create directory for SQLite database storage
RUN mkdir -p /app/data

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
