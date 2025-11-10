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
            ).rejects.toThrow(/already have a project/i);
        });
    });

    describe("getUserProjects", () => {
        it("should return all projects user has access to", async () => {
            await ProjectService.createProject(userId, { name: "Project 1" });
            await ProjectService.createProject(userId, { name: "Project 2" });

            const projects = await ProjectService.getUserProjects(userId);

            expect(projects).toHaveLength(2);
        });
    });

    describe("getProjectById", () => {
        it("should return project details", async () => {
            const created = await ProjectService.createProject(userId, {
                name: "Test project",
            });

            const project = await ProjectService.getProjectById(
                created.id,
                userId
            );

            expect(project.id).toBe(created.id);
            expect(project.members).toBeDefined();
        });

        it("should throw error if user has no access", async () => {
            const otherUser = await prisma.user.create({
                data: {
                    email: "other@example.com",
                    password: "password!W",
                },
            });

            const project = await ProjectService.createProject(userId, {
                name: "Other project",
            });

            await expect(
                ProjectService.getProjectById(project.id, otherUser.id)
            ).rejects.toThrow(/do not have access/i);
        });
    });

    describe("updateProject", () => {
        it("should update project details", async () => {
            const project = await ProjectService.createProject(userId, {
                name: "Old name",
            });

            const updated = await ProjectService.updateProject(
                project.id,
                userId,
                {
                    name: "New name",
                }
            );

            expect(updated.name).toBe("New name");
        });

        it("should throw error if user is not owner", async () => {
            const project = await ProjectService.createProject(userId, {
                name: "Test",
            });

            const member = await prisma.user.create({
                data: {
                    email: "member@example.com",
                    password: "password",
                },
            });

            await prisma.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: member.id,
                },
            });

            await expect(
                ProjectService.updateProject(project.id, member.id, {
                    name: "Hacked",
                })
            ).rejects.toThrow(/only project owner/i);
        });
    });

    describe("deleteProject", () => {
        it("should delete project", async () => {
            const project = await ProjectService.createProject(userId, {
                name: "Delete project",
            });

            await ProjectService.deleteProject(project.id, userId);

            const deleted = await prisma.project.findUnique({
                where: { id: project.id },
            });
            expect(deleted).toBeNull();
        });

        it("should throw error if project does not exist", async () => {
            await ProjectService.createProject(userId, {
                name: "Test",
            });

            await expect(
                ProjectService.deleteProject("xxxxxxxx", userId)
            ).rejects.toThrow(/not found/i);
        });

        it("should throw error if user is not owner", async () => {
            const project = await ProjectService.createProject(userId, {
                name: "Test",
            });

            const otherUser = await prisma.user.create({
                data: {
                    email: "other@example.com",
                    password: "password",
                },
            });

            await expect(
                ProjectService.deleteProject(project.id, otherUser.id)
            ).rejects.toThrow(/only project owner/i);
        });
    });
});
