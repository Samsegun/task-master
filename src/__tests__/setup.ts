import dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma";

dotenv.config({ path: ".env.test" });

const prisma = new PrismaClient();

beforeAll(async () => {
    console.log("connecting to db...");
    await prisma.$connect();
});

afterEach(async () => {
    const deleteRefreshTokens = prisma.refreshToken.deleteMany();
    const deleteUsers = prisma.user.deleteMany();

    await prisma.$transaction([deleteRefreshTokens, deleteUsers]);
});

afterAll(async () => {
    console.log("disconnecting to db...");
    await prisma.$disconnect();
});

export { prisma };
