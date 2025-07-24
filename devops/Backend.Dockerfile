# Use an official Node.js LTS image as the base
FROM node:20-alpine

# Set working directory to /workspace (root of monorepo)
WORKDIR /workspace

# Install pnpm globally
RUN npm install -g pnpm@10.10.0

# Install OpenSSL
RUN apk add --no-cache openssl
# RUN apk add --no-cache openssl bash curl git

# Copy package manager files for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json for better caching
COPY apps/backend/package.json ./apps/backend/package.json

# Install dependencies (for all workspaces)
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the monorepo
COPY . .

ARG BACKEND_DATABASE_URL
ENV BACKEND_DATABASE_URL=${BACKEND_DATABASE_URL}

ARG FRONTEND_URL
ENV FRONTEND_URL=${FRONTEND_URL}
ENV NODE_ENV=production

# Debug: print working directory and files
RUN pwd && ls -la

# Build the backend app
RUN pnpm --filter ./apps/backend... build:prisma

RUN pnpm --filter ./apps/backend... build

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-5000}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port (Railway will set PORT environment variable)
EXPOSE ${PORT:-5000}

# Start the backend app
CMD ["pnpm", "--filter", "./apps/backend...", "start"]
