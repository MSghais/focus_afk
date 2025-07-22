# Use an official Node.js LTS image as the base
FROM node:20-alpine

# Set working directory to /workspace (root of monorepo)
WORKDIR /workspace

# Install pnpm globally
RUN npm install -g pnpm

# Copy only the package manager files first for better caching
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies (for all workspaces)
RUN pnpm install --frozen-lockfile

# Copy the rest of the monorepo
COPY . .

# Build the backend app (replace 'backend' with your actual backend app path if different)
RUN pnpm --filter ./apps/backend... build

# Expose backend port (change if your backend uses a different port)
EXPOSE 3001

# Start the backend app
CMD ["pnpm", "--filter", "./apps/backend...", "start"]
