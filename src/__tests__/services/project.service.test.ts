import ProjectService from "../../services/project.service";
import { hashPassword } from "../../utils/passwordUtils";
import { prisma } from "../setup";

describe("ProjectService", () => {
    let userId: string;

    beforeEach(async () => {
        // create a verified user
        const hashedPassword = await hashPassword("Password123!");
        const user = await prisma.user.create({
            data: {
                email: "test@example.com",
                password: hashedPassword,
                isVerified: true,
            },
        });

        userId = user.id;
    });

    const validProjectData = {
        name: "project test",
        description: "testing project service endpoints",
    };

    describe("createProject", () => {
        it("should create project and add owner as member", async () => {
            const newProject = await ProjectService.createProject(userId, {
                ...validProjectData,
            });

            expect(newProject.name).toBe("project test");
            expect(newProject.ownerId).toBe(userId);

            // Check owner is added as member
            const member = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId: newProject.id,
                        userId,
                    },
                },
            });
            expect(member?.role).toBe("OWNER");
        });

        it("should throw error for duplicate project name by same user", async () => {
            await ProjectService.createProject(userId, { name: "Duplicate" });

            await expect(
                ProjectService.createProject(userId, { name: "Duplicate" })
            ).rejects.toThrow("You already have a project with this name");
        });
    });
});
