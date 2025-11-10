import ProjectService from "../../services/project.service";
import ProjectMemberService from "../../services/projectMember.service";
import { hashPassword } from "../../utils/passwordUtils";
import { prisma } from "../setup";

describe("ProjectMemberService", () => {
    let ownerId: string;
    let memberId: string;
    let projectId: string;

    beforeEach(async () => {
        const hashedPassword = await hashPassword("Password123!");

        // create project owner
        const owner = await prisma.user.create({
            data: {
                email: "test@example.com",
                password: hashedPassword,
                isVerified: true,
            },
        });
        ownerId = owner.id;

        // create project member
        const member = await prisma.user.create({
            data: {
                email: "member@example.com",
                password: hashedPassword,
                isVerified: true,
            },
        });
        memberId = member.id;

        // create project
        const project = await ProjectService.createProject(ownerId, {
            name: "Test Project",
        });
        projectId = project.id;
    });

    describe("addMember", () => {
        it("should add member to project", async () => {
            const newMember = await ProjectMemberService.addMember(
                projectId,
                ownerId,
                { email: "member@example.com" }
            );

            expect(newMember.userId).toBe(memberId);
            expect(newMember.role).toBe("MEMBER");
        });

        it("should throw error if user not found", async () => {
            await expect(
                ProjectMemberService.addMember(projectId, ownerId, {
                    email: "notfound@example.com",
                })
            ).rejects.toThrow(/email does not exist/i);
        });

        it("should throw error if user already a member", async () => {
            await ProjectMemberService.addMember(projectId, ownerId, {
                email: "member@example.com",
            });

            await expect(
                ProjectMemberService.addMember(projectId, ownerId, {
                    email: "member@example.com",
                })
            ).rejects.toThrow(/already a member/i);
        });

        it("should throw error if requester is not owner", async () => {
            await expect(
                ProjectMemberService.addMember(projectId, memberId, {
                    email: "member@example.com",
                })
            ).rejects.toThrow(/only project owner/i);
        });
    });

    describe("updateMemberRole", () => {
        beforeEach(async () => {
            // ddd member to project
            await ProjectMemberService.addMember(projectId, ownerId, {
                email: "member@example.com",
            });
        });

        it("should update member role to OWNER and demote current owner to MEMBER", async () => {
            await ProjectMemberService.updateMemberRole(
                projectId,
                memberId,
                ownerId,
                "OWNER"
            );

            // check new owner
            const newOwner = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId, userId: memberId },
                },
            });
            expect(newOwner?.role).toBe("OWNER");

            // check old owner demoted
            const oldOwner = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId, userId: ownerId },
                },
            });
            expect(oldOwner?.role).toBe("MEMBER");

            // check project ownerId updated
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });
            expect(project?.ownerId).toBe(memberId);
        });

        it("should throw error if requester is not owner", async () => {
            await expect(
                ProjectMemberService.updateMemberRole(
                    projectId,
                    memberId,
                    memberId,
                    "OWNER"
                )
            ).rejects.toThrow(/only project owner/i);
        });
    });

    describe("removeMember", () => {
        beforeEach(async () => {
            await ProjectMemberService.addMember(projectId, ownerId, {
                email: "member@example.com",
            });
        });

        it("should remove member from project", async () => {
            await ProjectMemberService.removeMember(
                projectId,
                memberId,
                ownerId
            );

            const removed = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId, userId: memberId },
                },
            });
            expect(removed).toBeNull();
        });

        it("should throw error if trying to remove owner", async () => {
            await expect(
                ProjectMemberService.removeMember(projectId, ownerId, ownerId)
            ).rejects.toThrow(/cannot remove project owner/i);
        });
    });

    describe("leaveProject", () => {
        beforeEach(async () => {
            await ProjectMemberService.addMember(projectId, ownerId, {
                email: "member@example.com",
            });
        });

        it("should allow member to leave project", async () => {
            await ProjectMemberService.leaveProject(projectId, memberId);

            const left = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId, userId: memberId },
                },
            });
            expect(left).toBeNull();
        });

        it("should throw error if owner tries to leave without another owner", async () => {
            await expect(
                ProjectMemberService.leaveProject(projectId, ownerId)
            ).rejects.toThrow(/promote another member to owner first/i);
        });

        it("should allow owner to leave if another owner exists", async () => {
            // promote member to owner
            await ProjectMemberService.updateMemberRole(
                projectId,
                memberId,
                ownerId,
                "OWNER"
            );

            // old owner (now member) should be able to leave
            await ProjectMemberService.leaveProject(projectId, ownerId);

            const left = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId, userId: ownerId },
                },
            });
            expect(left).toBeNull();
        });
    });
});
