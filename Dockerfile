# syntax=docker/dockerfile:1
FROM node:22-alpine3.23 AS builder

WORKDIR /app
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@10.12.4

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY entrypoint.sh ./

RUN pnpm install --frozen-lockfile
RUN pnpm run generate
RUN pnpm run build

FROM node:22-alpine3.23 AS production

WORKDIR /app
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@10.12.4

COPY package.json pnpm-lock.yaml ./

# THE FIX: Chain the install and the cache-clearing in a single RUN command.
# If you don't chain them with `&&`, Docker will still save the 400MB cache in the install layer!
RUN pnpm install --prod --frozen-lockfile \
    && pnpm store prune \
    && rm -rf /pnpm/store

RUN pnpm add prisma@6.17.1

# Copy compiled dist from builder stage
COPY --from=builder /app/dist ./dist

# THE FIX: Copy ONLY the schema and migrations. Do NOT copy the whole folder.
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations

# Regenerate client to match this stage
RUN pnpm run generate

COPY entrypoint.sh .
RUN chmod +x /app/entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["pnpm", "run", "start"]