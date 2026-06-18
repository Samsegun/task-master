#!/bin/sh

echo "Running Prisma migrations..."
pnpm run migrate        # ← your existing migration script

echo "Starting server..."
exec "$@"               # ← runs whatever CMD is passed (dev or prod)