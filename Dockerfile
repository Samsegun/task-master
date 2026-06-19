# syntax=docker/dockerfile:1
FROM node:22-alpine3.23 AS base

WORKDIR /app
ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS builder

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm run generate && pnpm run build

FROM base AS production

ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-prod-store,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile && \
    pnpm store prune && \
    rm -rf /pnpm/store /root/.cache /root/.npm


COPY --from=builder /app/dist ./dist

# THE FIX: Copy ONLY the schema and migrations. Do NOT copy the whole folder.
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh && \
    rm -rf /root/.cache /root/.npm /tmp/*

EXPOSE 3001

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "dist/src/server.js"]