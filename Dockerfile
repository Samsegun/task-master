# --- STAGE 1: Base Environment Configuration ---
FROM node:22-alpine3.23 AS base

WORKDIR /app
ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate


# --- STAGE 2: Install Development Dependencies ---
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


# --- STAGE 3: Build the Application Source ---
FROM deps AS builder

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm run generate && pnpm run build


# --- STAGE 4: Isolated Production Dependency & Client Generation ---
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install ONLY production packages and run generation in this throwaway stage
RUN --mount=type=cache,id=pnpm-prod-store,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile && \
    pnpm run generate


# --- STAGE 5: The Ultra-Lightweight Production Runner ---
# Notice we pull directly from the raw alpine base image to bypass Corepack/pnpm setup bloat
FROM node:22-alpine3.23 AS production

WORKDIR /app
ENV NODE_ENV=production \
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# 1. Copy over your built code & essential runtime assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/docs ./src/docs
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY package.json ./

# 2. CRITICAL CHANGE: Copy the ready-made production node_modules
# This contains the fully linked and pre-generated Prisma client files!
COPY --from=prod-deps /app/node_modules ./node_modules

# 3. Setup your shell scripts
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "dist/src/server.js"]
