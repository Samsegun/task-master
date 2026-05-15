import { ProjectRole } from "@prisma/client";
import {
    EntityNotFound,
    ForbiddenError,
    UnauthorizedError,
    ValidationError,
} from "../errors";
import prisma from "../utils/prisma";
import EmailService from "./email.service";
import { generateInvitationToken } from "../utils/tokenManagement";
import { InvitationTokenPayload } from "../utils/types";

class ProjectMemberService {
    static async inviteMember(
        projectId: string,
        requesterId: string,
        data: { email: string; role?: ProjectRole },
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
            throw new ForbiddenError("Only project owners can invite members");

        // get project details
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true, id: true },
        });
        if (!project) throw new EntityNotFound("Project not found");

        // check if user exists
        const userToInvite = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
            },
        });

        // get inviter details for email
        const inviter = await prisma.user.findUnique({
            where: { id: requesterId },
            select: {
                firstName: true,
                lastName: true,
                username: true,
            },
        });

        const inviterName = inviter?.firstName
            ? `${inviter.firstName} ${inviter.lastName || ""}`
            : inviter?.username || "Someone";

        // CASE 1: User exists - Add to ProjectMember with PENDING status
        if (userToInvite) {
            // Check if already a member
            const existingMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: userToInvite.id,
                    },
                },
            });

            if (existingMember) {
                if (existingMember.status === "ACTIVE")
                    throw new ValidationError(
                        "User is already a member of this project",
                    );

                if (existingMember.status === "PENDING")
                    throw new ValidationError(
                        "User already has a pending invitation",
                    );
            }

            // create pending membership
            const invitation = await prisma.projectMember.create({
                data: {
                    projectId,
                    userId: userToInvite.id,
                    role: data.role || "MEMBER",
                    status: "PENDING",
                    invitedBy: requesterId,
                },
            });

            // Generate token
            const invitationToken = generateInvitationToken({
                type: "existing_user",
                projectId,
                userId: userToInvite.id,
                invitationId: invitation.id,
            });

            // Send email
            await EmailService.sendProjectInvitationEmail(userToInvite.email, {
                projectName: project.name,
                inviterName,
                invitationToken,
                isNewUser: false,
            });

            return {
                message: "Invitation sent successfully",
                invitation: {
                    id: invitation.id,
                    email: userToInvite.email,
                    role: invitation.role,
                    status: "PENDING",
                    userExists: true,
                },
            };
        }

        // CASE 2: user doesn't exist - create ProjectInvitation
        else {
            // check if invitation already exists
            const existingInvitation =
                await prisma.projectInvitation.findUnique({
                    where: {
                        email_projectId: {
                            email: data.email,
                            projectId,
                        },
                    },
                });

            if (existingInvitation) {
                if (existingInvitation.status === "PENDING") {
                    throw new ValidationError(
                        "An invitation has already been sent to this email",
                    );
                }
                if (existingInvitation.status === "ACCEPTED") {
                    throw new ValidationError(
                        "This invitation was previously accepted",
                    );
                }
            }

            // generate token
            const invitationToken = generateInvitationToken({
                type: "new_user",
                email: data.email,
                projectId,
            });

            // create invitation
            const invitation = await prisma.projectInvitation.create({
                data: {
                    email: data.email,
                    projectId,
                    invitedBy: requesterId,
                    role: data.role || "MEMBER",
                    token: invitationToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    status: "PENDING",
                },
            });

            // send email with signup + accept flow
            await EmailService.sendProjectInvitationEmail(data.email, {
                projectName: project.name,
                inviterName,
                invitationToken,
                isNewUser: true,
            });

            return {
                message: "Invitation sent successfully.",
                invitation: {
                    id: invitation.id,
                    email: data.email,
                    role: invitation.role,
                    status: "PENDING",
                    userExists: false,
                },
            };
        }
    }

    static async acceptInvitation(
        invitationPayload: InvitationTokenPayload,
        requesterId: string,
    ) {
        // existing user ──────────────────────────────────────────
        if (invitationPayload.type === "existing_user") {
            const { projectId, userId, invitationId } = invitationPayload;

            // Ensure the token belongs to the authenticated user
            if (userId !== requesterId)
                throw new ForbiddenError(
                    "This invitation does not belong to you",
                );

            // Fetch the pending ProjectMember row
            const member = await prisma.projectMember.findUnique({
                where: { id: invitationId },
            });
            if (!member) throw new EntityNotFound("Invitation not found");

            if (member.projectId !== projectId || member.userId !== userId)
                throw new ValidationError("Invitation token mismatch");

            if (member.status === "ACTIVE")
                throw new ValidationError(
                    "Invitation has already been accepted",
                );

            if (member.status === "DECLINED")
                throw new ValidationError("Invitation was previously declined");

            // Activate membership
            const updated = await prisma.projectMember.update({
                where: { id: invitationId },
                data: { status: "ACTIVE" },
            });

            return {
                message: "Invitation accepted successfully",
                membership: {
                    id: updated.id,
                    projectId: updated.projectId,
                    userId: updated.userId,
                    role: updated.role,
                    status: updated.status,
                },
            };
        }

        // new user ──────────────────────────────────────────────────
        if (invitationPayload.type === "new_user") {
            const { email, projectId } = invitationPayload;

            // The caller must be authenticated (registered) at this point
            const registeredUser = await prisma.user.findUnique({
                where: { id: requesterId },
                select: { id: true, email: true },
            });
            if (!registeredUser) throw new EntityNotFound("User not found");

            // Guard: the registered email must match the invited email
            if (registeredUser.email.toLowerCase() !== email!.toLowerCase())
                throw new ForbiddenError(
                    "This invitation was sent to a different email address",
                );

            // Fetch the ProjectInvitation row
            const invitation = await prisma.projectInvitation.findUnique({
                where: {
                    email_projectId: { email: email!, projectId },
                },
            });
            if (!invitation) throw new EntityNotFound("Invitation not found");

            if (invitation.status === "ACCEPTED")
                throw new ValidationError(
                    "Invitation has already been accepted",
                );

            if (invitation.status === "DECLINED")
                throw new ValidationError("Invitation was previously declined");

            if (invitation.status !== "PENDING")
                throw new ValidationError("Invitation is no longer valid");

            // Check expiry
            if (invitation.expiresAt < new Date())
                throw new ValidationError("Invitation has expired");

            // Guard: user must not already be an active member
            const existingMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId, userId: requesterId },
                },
            });
            if (existingMember?.status === "ACTIVE")
                throw new ValidationError(
                    "You are already a member of this project",
                );

            // transactionally create the membership and mark invitation ACCEPTED
            const [membership] = await prisma.$transaction([
                prisma.projectMember.create({
                    data: {
                        projectId,
                        userId: requesterId,
                        role: invitation.role,
                        status: "ACTIVE",
                        invitedBy: invitation.invitedBy,
                    },
                }),
                prisma.projectInvitation.update({
                    where: { id: invitation.id },
                    data: { status: "ACCEPTED" },
                }),
            ]);

            return {
                message: "Invitation accepted successfully",
                membership: {
                    id: membership.id,
                    projectId: membership.projectId,
                    userId: membership.userId,
                    role: membership.role,
                    status: membership.status,
                },
            };
        }

        // should never reach here but if token signing is incorrect
        throw new ValidationError("Unknown invitation type");
    }

    static async declineInvitation(
        invitationPayload: InvitationTokenPayload,
        requesterId: string | null,
    ) {
        // existing user ─────────────────────────────────────────────
        if (invitationPayload.type === "existing_user") {
            const { projectId, userId, invitationId } = invitationPayload;

            // must be authenticated to decline on behalf of a user account
            if (!requesterId)
                throw new ForbiddenError(
                    "Authentication required to decline this invitation",
                );

            if (userId !== requesterId)
                throw new ForbiddenError(
                    "This invitation does not belong to you",
                );

            const member = await prisma.projectMember.findUnique({
                where: { id: invitationId },
            });

            if (!member) throw new EntityNotFound("Invitation not found");

            if (member.projectId !== projectId || member.userId !== userId)
                throw new ValidationError("Invitation token mismatch");

            if (member.status === "ACTIVE")
                throw new ValidationError(
                    "Cannot decline an already-accepted invitation",
                );

            if (member.status === "DECLINED")
                throw new ValidationError(
                    "Invitation has already been declined",
                );

            /*
                 i decided to choose delete over update because:
                 1) it simplifies the logic for accepting invitations - i only need to check for existing active membership and not worry about pending/declined status
                 2) from a UX perspective, if a user declines an invitation and later wants to join, it's more intuitive to just receive a new invitation email rather than having to contact support to reactivate a declined invitation
                 3) it keeps the database cleaner by not having rows with declined status that are essentially inactive and serve no purpose other than historical record-keeping, which doesn't seem necessary for invitations
            */

            // await prisma.projectMember.update({
            //     where: { id: invitationId },
            //     data: { status: "DECLINED" },
            // });
            await prisma.projectMember.delete({
                where: { id: invitationId },
            });

            return { message: "Invitation declined successfully" };
        }

        // new user ──────────────────────────────────────────────────
        if (invitationPayload.type === "new_user") {
            const { email, projectId } = invitationPayload;

            // If the caller is authenticated, verify the email matches
            if (requesterId) {
                const user = await prisma.user.findUnique({
                    where: { id: requesterId },
                    select: { email: true },
                });

                if (user && user.email.toLowerCase() !== email!.toLowerCase())
                    throw new ForbiddenError(
                        "This invitation was sent to a different email address",
                    );
            }

            const invitation = await prisma.projectInvitation.findUnique({
                where: {
                    email_projectId: { email: email!, projectId },
                },
            });

            if (!invitation) throw new EntityNotFound("Invitation not found");

            if (invitation.status === "ACCEPTED")
                throw new ValidationError(
                    "Cannot decline an already-accepted invitation",
                );

            if (invitation.status === "DECLINED")
                throw new ValidationError(
                    "Invitation has already been declined",
                );

            if (invitation.expiresAt < new Date())
                throw new ValidationError("Invitation has already expired");

            await prisma.projectInvitation.update({
                where: { id: invitation.id },
                data: { status: "DECLINED" },
            });

            return { message: "Invitation declined successfully" };
        }

        throw new ValidationError("Unknown invitation type");
    }

    // old add member by owner method - can be used for adding members without invitation
    static async addMember(
        projectId: string,
        userId: string,
        data: { email: string; role?: ProjectRole },
    ) {
        // check if current user is owner
        const requesterMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        if (!requesterMember || requesterMember.role !== ProjectRole["OWNER"])
            throw new ForbiddenError("Only project owner can add members");

        // find user by email
        const userToAdd = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
            },
        });
        if (!userToAdd) throw new EntityNotFound("Invalid credentials");

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
                "User is already a member of this project",
            );

        // if owner role is requested for the new member, perform atomic transfer:
        if (data.role === ProjectRole["OWNER"]) {
            // create new member as OWNER
            await prisma.$transaction([
                prisma.projectMember.create({
                    data: {
                        projectId,
                        userId: userToAdd.id,
                        role: ProjectRole["OWNER"],
                    },
                }),

                // demote current owner (requester) to MEMBER
                prisma.projectMember.update({
                    where: {
                        projectId_userId: {
                            projectId,
                            userId,
                        },
                    },
                    data: { role: ProjectRole["MEMBER"] },
                }),

                // update project's ownerId to the new owner
                prisma.project.update({
                    where: { id: projectId },
                    data: { ownerId: userToAdd.id },
                }),
            ]);

            const created = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: userToAdd.id,
                    },
                },
                select: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    role: true,
                },
            });

            return created;
        }

        // add member
        const newMember = await prisma.projectMember.create({
            data: {
                projectId,
                userId: userToAdd.id,
                role: data.role || ProjectRole["MEMBER"],
            },
            select: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                role: true,
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
        if (!member)
            throw new ForbiddenError("You do not have access to this project");

        const projectMembers = await prisma.projectMember.findMany({
            where: { projectId, status: "ACTIVE" },
            select: {
                id: true,
                projectId: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                role: true,
                joinedAt: true,
            },
            orderBy: [{ status: "asc" }, { joinedAt: "asc" }],
        });

        return projectMembers;
    }

    static async updateMemberRole(
        projectId: string,
        userIdToUpdate: string,
        requesterId: string,
        newRole: ProjectRole,
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
                "Only project owner can update member roles",
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

        if (requesterId === userIdToUpdate && newRole !== "OWNER")
            throw new ForbiddenError(
                "Project owner cannot change their own role. Promote another member to owner first or delete the project.",
            );

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
            // just update to MEMBER or any other role that comes up in later versions of the app (normal role change)
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
        requesterId: string,
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
        if (userIdToRemove === project?.ownerId)
            throw new ForbiddenError(
                "Cannot remove project owner from project",
            );

        await prisma.$transaction([
            // Unassign all tasks assigned to this member in this project
            prisma.task.updateMany({
                where: {
                    projectId: projectId,
                    assigneeId: userIdToRemove,
                },
                data: {
                    assigneeId: null,
                },
            }),

            // remove member
            prisma.projectMember.delete({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: userIdToRemove,
                    },
                },
            }),
        ]);

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
                    "Project owner cannot leave. Promote another member to owner first or delete the project.",
                );
        }

        await prisma.$transaction([
            prisma.task.updateMany({
                where: {
                    projectId: projectId,
                    assigneeId: userId,
                },
                data: {
                    assigneeId: null,
                },
            }),
            // leave project
            prisma.projectMember.delete({
                where: {
                    projectId_userId: {
                        projectId,
                        userId,
                    },
                },
            }),
        ]);

        return { message: "You have left the project successfully" };
    }
}

export default ProjectMemberService;
