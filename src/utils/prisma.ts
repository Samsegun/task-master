import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;

// "dev": "cross-env NODE_ENV=development nodemon --watch src --exec ts-node src/server.ts",
//         "test:mode": "cross-env NODE_ENV=test nodemon --watch src --exec ts-node src/server.ts",
//         "test": "npx dotenv -e .env.test -- jest",
//         "test:watch": "jest --watch",
//         "test:coverage": "jest --coverage",
//         "migrate:dev": "npx prisma migrate dev --schema=prisma/dev/schema.prisma",
//         "migrate:test": "npx dotenv -e .env.test -- npx prisma migrate dev --schema=prisma/test/schema.prisma",
//         "gen:dev": "npx prisma generate --schema=prisma/dev/schema.prisma",
//         "gen:test": "npx prisma generate --schema=prisma/test/schema.prisma"
//     },
