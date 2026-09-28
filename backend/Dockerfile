# Multi-stage Dockerfile for Real-time Chat Backend
FROM node:24-slim AS builder

WORKDIR /app

# Install build dependencies for native compilation (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy package files and install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source code and build TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production runtime stage
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=./data/chat.db

# Install build tools for native compilation if required
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Create directory for SQLite database storage
RUN mkdir -p /app/data ./data

# Expose port (defaults to 4000, listens on process.env.PORT)
EXPOSE 4000

# Health check pinging process.env.PORT using built-in fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 4000) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the server listening on process.env.PORT
CMD ["node", "dist/index.js"]
