import prisma from "../utils/prisma";

beforeAll(async () => {
    console.log("connecting to db...");
    await prisma.$connect();
});

afterEach(async () => {
    await prisma.$transaction([
        prisma.refreshToken.deleteMany(),
        prisma.task.deleteMany(),
        prisma.projectInvitation.deleteMany(),
        prisma.projectMember.deleteMany(),
        prisma.project.deleteMany(),
        prisma.user.deleteMany(),
    ]);

    jest.clearAllMocks();
});

afterAll(async () => {
    console.log("disconnecting from db...");
    await prisma.$disconnect();
});

export { prisma };
