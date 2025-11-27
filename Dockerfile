# Use a lightweight Node.js base image that satisfies Next.js requirements
FROM node:20.11-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build the app
FROM base AS builder
COPY . .
RUN npm run build

# Production stage
FROM base AS production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
