#!/bin/sh

echo "Running Prisma migrations..."
pnpm run migrate        # ← your existing migration script

echo "Generating Prisma client..."
pnpm run generate 


echo "Starting server..."
exec "$@"               # ← runs whatever CMD is passed (dev or prod)