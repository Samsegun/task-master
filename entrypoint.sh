#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy        # ← your existing migration script

echo "Starting server..."
exec "$@"               # ← runs whatever CMD is passed (dev or prod)