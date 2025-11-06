import { EntityNotFound, ForbiddenError, ValidationError } from "../errors";
import prisma from "../utils/prisma";
import { CreateProject, ProjectStatus } from "../validators/project.validator";

class ProjectService {
    static async createProject(ownerId: string, data: CreateProject) {
        const project = await prisma.$transaction(async tx => {
            const { name, description } = data;

            const owner = await tx.user.findUnique({
                where: {
                    id: ownerId,
                },
                select: { id: true },
            });
            if (!owner)
                throw new EntityNotFound(`User with id ${ownerId} not found.`);

            const projectExistsByName = await tx.project.findFirst({
                where: {
                    name,
                    ownerId,
                },
            });
            if (projectExistsByName)
                throw new ValidationError(
                    "You already have a project with this name"
                );

            const newProject = await tx.project.create({
                data: {
                    name,
                    description,
                    ownerId,
                },
            });

            await tx.projectMember.create({
                data: {
                    projectId: newProject.id,
                    userId: ownerId,
                    role: "OWNER",
                },
            });

            return newProject;
        });

        return project;
    }

    static async getUserProjects(userId: string) {
        const projects = await prisma.project.findMany({
            take: 3,
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        members: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return projects;
    }

    static async getProjectById(projectId: string, userId: string) {
        // check if user has access to this project
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

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                    omit: {
                        joinedAt: true,
                        projectId: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        if (!project) {
            throw new EntityNotFound("Project not found");
        }

        return project;
    }

    static async updateProject(
        projectId: string,
        userId: string,
        data: { name?: string; description?: string; status?: ProjectStatus }
    ) {
        // check if user is owner or has permission
        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        if (!member || member.role !== "OWNER")
            throw new ForbiddenError(
                "Only project owners can update project details"
            );

        const project = await prisma.project.update({
            where: { id: projectId },
            data,
        });

        return project;
    }

    static async deleteProject(projectId: string, userId: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new EntityNotFound("Project not found");
        }
        if (project.ownerId !== userId) {
            throw new ForbiddenError(
                "Only project owner can delete this project"
            );
        }

        await prisma.project.delete({
            where: { id: projectId },
        });

        return { message: "Project deleted successfully" };
    }
}

export default ProjectService;
