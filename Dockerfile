# Build stage
FROM node:25-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY . ./
RUN npm run build

# Runtime stage
FROM node:25-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy node_modules and dist from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package.json ./

# Expose Nest port
EXPOSE 3000

# Start command is provided via docker-compose to allow running migrations before start
CMD ["node", "dist/main.js"]

