FROM node:22-alpine3.23 AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@10.12.4

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# ──────────────────────────────────────────
# DEVELOPMENT — nodemon + ts-node, no build
# ──────────────────────────────────────────
FROM base AS development
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["pnpm", "run", "dev"]


# ──────────────────────────────────────────
# BUILDER — compile TypeScript for prod
# ──────────────────────────────────────────
FROM base AS builder
RUN pnpm run build


# ──────────────────────────────────────────
# PRODUCTION — lean image, no devDependencies
# ──────────────────────────────────────────
FROM node:22-alpine3.23 AS production

WORKDIR /app

ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@10.12.4

# Copy only package files and install prod deps only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy compiled dist from builder stage
COPY --from=builder /app/dist ./dist

# Copy prisma folder (needed for prisma client at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["pnpm", "run", "start"]