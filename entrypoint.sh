#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy        

echo "Starting server..."
exec "$@"               # runs whatever CMD is passed (dev or prod)