# Use an official Node.js LTS image as the base
FROM node:20-alpine

# Set working directory to /workspace (root of monorepo)
WORKDIR /workspace

# Install pnpm globally
RUN npm install -g pnpm@10.10.0

# Copy package manager files for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json for better caching
COPY apps/backend/package.json ./apps/backend/package.json

# Install dependencies (for all workspaces)
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the monorepo
COPY . .

# Debug: print working directory and files
RUN pwd && ls -la

# Build the backend app
RUN pnpm --filter ./apps/backend... build:prisma

RUN pnpm --filter ./apps/backend... build

# Expose backend port
EXPOSE 5000

# Start the backend app
CMD ["pnpm", "--filter", "./apps/backend...", "start"]
