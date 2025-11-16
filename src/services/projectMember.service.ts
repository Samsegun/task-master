import { ProjectRole } from "@prisma/client";
import { EntityNotFound, ForbiddenError, ValidationError } from "../errors";
import prisma from "../utils/prisma";

class ProjectMemberService {
    static async addMember(
        projectId: string,
        requesterId: string,
        data: { email: string; role?: ProjectRole }
    ) {
        // check if current user is owner
        const requesterMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: requesterId,
                },
            },
        });
        if (!requesterMember || requesterMember.role !== "OWNER")
            throw new ForbiddenError("Only project owner can add members");

        // find user by email
        const userToAdd = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
            },
        });
        if (!userToAdd)
            throw new EntityNotFound("User with this email does not exist");

        // check if user is already a member
        const existingMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: userToAdd.id,
                },
            },
        });
        if (existingMember)
            throw new ValidationError(
                "User is already a member of this project"
            );

        // add member
        const newMember = await prisma.projectMember.create({
            data: {
                projectId,
                userId: userToAdd.id,
                role: data.role || "MEMBER",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return newMember;
    }

    static async getMembers(projectId: string, userId: string) {
        // check if user has access
        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        if (!member) {
            throw new ForbiddenError("You do not have access to this project");
        }

        const projectMembers = await prisma.projectMember.findMany({
            where: { projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                joinedAt: "asc",
            },
        });

        return projectMembers;
    }

    static async updateMemberRole(
        projectId: string,
        userIdToUpdate: string,
        requesterId: string,
        newRole: ProjectRole
    ) {
        // check if requester is owner
        const requesterMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: requesterId,
                },
            },
        });
        if (!requesterMember || requesterMember.role !== "OWNER")
            throw new ForbiddenError(
                "Only project owner can update member roles"
            );

        // check if member exists
        const memberToUpdate = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: userIdToUpdate,
                },
            },
        });
        if (!memberToUpdate || memberToUpdate.projectId !== projectId)
            throw new EntityNotFound("Member not found in this project");

        // if promoting someone to OWNER, demote current owner to MEMBER
        if (newRole === "OWNER") {
            await prisma.$transaction([
                // demote current owner to MEMBER
                prisma.projectMember.update({
                    where: {
                        projectId_userId: {
                            projectId,
                            userId: requesterId,
                        },
                    },
                    data: { role: "MEMBER" },
                }),
                // promote new owner to OWNER
                prisma.projectMember.update({
                    where: {
                        projectId_userId: {
                            projectId,
                            userId: userIdToUpdate,
                        },
                    },
                    data: { role: "OWNER" },
                }),
                // update project ownerId
                prisma.project.update({
                    where: { id: projectId },
                    data: { ownerId: userIdToUpdate },
                }),
            ]);
        } else {
            // just update to MEMBER (normal role change)
            await prisma.projectMember.update({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: userIdToUpdate,
                    },
                },
                data: { role: newRole },
            });
        }

        const updatedMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: userIdToUpdate,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        return updatedMember;
    }

    static async removeMember(
        projectId: string,
        userIdToRemove: string,
        requesterId: string
    ) {
        // check if requester is owner
        const requesterMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: requesterId,
                },
            },
        });
        if (!requesterMember || requesterMember.role !== "OWNER")
            throw new ForbiddenError("Only project owner can remove members");

        // check if member exists
        const memberToRemove = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: userIdToRemove,
                },
            },
        });

        if (!memberToRemove)
            throw new EntityNotFound("Member not found in this project");

        // prevent removing project owner
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true },
        });

        if (userIdToRemove === project?.ownerId) {
            throw new ForbiddenError(
                "Cannot remove project owner from project"
            );
        }

        // remove member
        await prisma.projectMember.delete({
            where: {
                projectId_userId: {
                    projectId,
                    userId: userIdToRemove,
                },
            },
        });

        return { message: "Member removed successfully" };
    }

    static async leaveProject(projectId: string, userId: string) {
        // check if user is a member
        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        if (!member)
            throw new EntityNotFound("You are not a member of this project");

        // check if user is the owner
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true },
        });
        if (project?.ownerId === userId) {
            // check if there's at least one other owner
            const otherOwners = await prisma.projectMember.count({
                where: {
                    projectId,
                    role: "OWNER",
                    userId: { not: userId },
                },
            });

            if (otherOwners === 0)
                throw new ForbiddenError(
                    "Project owner cannot leave. Promote another member to owner first or delete the project."
                );
        }

        // leave project
        await prisma.projectMember.delete({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });

        return { message: "You have left the project successfully" };
    }
}

export default ProjectMemberService;
