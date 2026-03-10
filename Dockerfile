FROM node:18-alpine AS base

# ── Install dependencies ────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Build the Next.js frontend ──────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set DATABASE_URL for prisma generate (required at build time)
ENV DATABASE_URL=file:./dev.db

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ── Production image ────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/dev.db

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 teamcal

# Copy package files and built artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

# Create data directory for SQLite and ensure writable
RUN mkdir -p /app/data && chown -R teamcal:nodejs /app/data /app/prisma

# Generate Prisma client in production layer
RUN npx prisma generate

USER teamcal

EXPOSE 3000 3001

# Initialize the database and start both services
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run dev"]
