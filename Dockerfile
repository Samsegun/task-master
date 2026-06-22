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
    rm -rf /root/.cache /root/.npm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/docs ./src/docs
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Cleanup
RUN rm -rf /root/.cache /root/.npm /tmp/*

EXPOSE 3001

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "dist/src/server.js"]