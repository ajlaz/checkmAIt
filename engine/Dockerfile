# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose ports
# HTTP API port
EXPOSE 3000
# WebSocket base port range (you may need to expose more ports for multiple games)
EXPOSE 9000-9100

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]
