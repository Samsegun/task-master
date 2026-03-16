import { ProjectStatus } from "@prisma/client";
import { EntityNotFound, ForbiddenError, ValidationError } from "../errors";
import {
    numOfcompletedTasks,
    progressNumber,
    projectTasksLength,
} from "../utils/computeProjectMetrics";
import prisma from "../utils/prisma";
import { GetDataOptions } from "../utils/types";
import { CreateProject } from "../validators/project.validator";

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

    static async getUserProjects(userId: string, queryOptions: GetDataOptions) {
        const {
            limit,
            sortBy = "updatedAt",
            sortOrder = "desc",
        } = queryOptions;

        const projects = await prisma.project.findMany({
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
                tasks: {
                    select: {
                        id: true,
                        status: true,
                        dueDate: true,
                    },
                },
                _count: {
                    select: {
                        // tasks: true,
                        members: true,
                    },
                },
            },
            orderBy: {
                [sortBy]: sortOrder,
            },
            ...(limit && { take: limit }),
        });

        // computed progress and due date for each project
        const projectsWithMetrics = projects.map(project => {
            const totalTasks = projectTasksLength(project.tasks);
            // const completedTasks = project.tasks.filter(
            //     t => t.status === "DONE"
            // ).length;
            // const progress =
            //     totalTasks > 0
            //         ? Math.round((completedTasks / totalTasks) * 100)
            const completedTasks = numOfcompletedTasks(project.tasks);
            const progress = progressNumber(totalTasks, completedTasks);

            /** get latest dueDates from tasks
             *
             * project due date is same as due date for last created task
             *
             * */
            const dueDates = project.tasks
                .map(t => t.dueDate)
                .filter((date): date is Date => date != null);

            const dueDate =
                dueDates.length > 0
                    ? new Date(Math.max(...dueDates.map(d => d.getTime())))
                    : null;

            const { tasks, ...projectData } = project;

            return {
                ...projectData,
                completedTasks,
                totalTasks,
                progress,
                dueDate,
            };
        });

        return projectsWithMetrics;
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
        if (!member)
            throw new ForbiddenError("You do not have access to this project");

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                tasks: {
                    select: {
                        dueDate: true,
                        status: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
            // include: {
            //     owner: {
            //         select: {
            //             id: true,
            //             email: true,
            //         },
            //     },
            //     members: {
            //         include: {
            //             user: {
            //                 select: {
            //                     id: true,
            //                     email: true,
            //                 },
            //             },
            //         },
            //         omit: {
            //             joinedAt: true,
            //             projectId: true,
            //         },
            //     },
            //     _count: {
            //         select: {
            //             tasks: true,
            //         },
            //     },
            // },
        });
        if (!project) {
            throw new EntityNotFound("Project not found");
        }

        /*** project metrics ***/
        const totalMembers = project._count.members;

        const totalTasks = projectTasksLength(project.tasks);
        const completedTasks = numOfcompletedTasks(project.tasks);
        const progress = progressNumber(totalTasks, completedTasks);

        // get latest dueDates from tasks
        const dueDates = project.tasks
            .map(t => t.dueDate)
            .filter((date): date is Date => date != null);
        const dueDate =
            dueDates.length > 0
                ? new Date(Math.max(...dueDates.map(d => d.getTime())))
                : null;

        const projectData = {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            dueDate,
            totalMembers,
            progress,
        };

        return projectData;
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
                "Only project owner can update project details"
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
