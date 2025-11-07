import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

const envPath = path.join(process.cwd(), ".env.test");
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

beforeAll(async () => {
    console.log("connecting to db...");
    await prisma.$connect();
});

afterEach(async () => {
    const deleteRefreshTokens = prisma.refreshToken.deleteMany();
    const deleteTasks = prisma.task.deleteMany();
    const deleteProjectMembers = prisma.projectMember.deleteMany();
    const deleteProjects = prisma.project.deleteMany();
    const deleteUsers = prisma.user.deleteMany();

    await prisma.$transaction([
        deleteRefreshTokens,
        deleteTasks,
        deleteProjectMembers,
        deleteProjects,
        deleteUsers,
    ]);
});

afterAll(async () => {
    console.log("disconnecting from db...");
    await prisma.$disconnect();
});

export { prisma };
