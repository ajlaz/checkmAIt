FROM golang:1.25-alpine AS builder

# Install necessary build tools
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum to leverage Docker cache
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server

# Create a minimal production image
FROM alpine:3.19

# Add CA certificates, timezone data, and networking tools
RUN apk add --no-cache ca-certificates tzdata netcat-openbsd

# Copy certificates from the builder
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Create a non-root user
RUN adduser -D -g '' appuser

WORKDIR /app

# Copy the binary and any necessary files
COPY --from=builder /app/server .
COPY --from=builder /app/db/migrations ./db/migrations
COPY .env.example .env

# Switch to non-root user
USER appuser

# Set environment variables
ENV GIN_MODE=release

# Expose server port
EXPOSE 8080

# Default command (can be overridden by docker-compose)
CMD ["./server", "serve"]