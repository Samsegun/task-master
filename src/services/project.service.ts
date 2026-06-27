import { ProjectStatus } from "@prisma/client";
import { EntityNotFound, ForbiddenError, ValidationError } from "../errors";
import { progressNumber } from "../utils/computeProjectMetrics";
import prisma from "../utils/prisma";
import { GetDataOptions } from "../utils/types";
import { CreateProject } from "../validators/project.validator";

class ProjectService {
    static async createProject(ownerId: string, data: CreateProject) {
        const project = await prisma.$transaction(async (tx) => {
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
                    "You already have a project with this name",
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
                    status: "ACTIVE",
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
                        status: "ACTIVE",
                    },
                },
            },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                ownerId: true,
                createdAt: true,
                updatedAt: true,
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
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
        const projectIds = projects.map((project) => project.id);

        /** get latest dueDates from tasks
         * project due date is same as due date for last created task
         *
         * */
        const [totalTaskCounts, completedTaskCounts, dueDateAggregates] =
            projectIds.length > 0
                ? await Promise.all([
                      prisma.task.groupBy({
                          by: ["projectId"],
                          where: { projectId: { in: projectIds } },
                          _count: { _all: true },
                      }),
                      prisma.task.groupBy({
                          by: ["projectId"],
                          where: {
                              projectId: { in: projectIds },
                              status: "DONE",
                          },
                          _count: { _all: true },
                      }),
                      prisma.task.groupBy({
                          by: ["projectId"],
                          where: { projectId: { in: projectIds } },
                          _max: { dueDate: true },
                      }),
                  ])
                : [[], [], []];

        const totalTasksByProjectId = new Map(
            totalTaskCounts.map((count) => [
                count.projectId,
                count._count._all,
            ]),
        );
        const completedTasksByProjectId = new Map(
            completedTaskCounts.map((count) => [
                count.projectId,
                count._count._all,
            ]),
        );
        const dueDateByProjectId = new Map(
            dueDateAggregates.map((aggregate) => [
                aggregate.projectId,
                aggregate._max.dueDate,
            ]),
        );

        return projects.map((project) => {
            const totalTasks = totalTasksByProjectId.get(project.id) ?? 0;
            const completedTasks =
                completedTasksByProjectId.get(project.id) ?? 0;
            const progress = progressNumber(totalTasks, completedTasks);

            return {
                ...project,
                completedTasks,
                totalTasks,
                progress,
                dueDate: dueDateByProjectId.get(project.id) ?? null,
            };
        });
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
        if (!member || member.status !== "ACTIVE")
            throw new ForbiddenError("You do not have access to this project");

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                members: {
                    select: {
                        joinedAt: true,
                        role: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });
        if (!project) {
            throw new EntityNotFound("Project not found");
        }

        /*** project metrics ***/
        const totalMembers = project._count.members;

        const [totalTasks, completedTasks, dueDateAggregate] =
            await Promise.all([
                prisma.task.count({ where: { projectId } }),
                prisma.task.count({ where: { projectId, status: "DONE" } }),
                prisma.task.aggregate({
                    where: { projectId },
                    _max: { dueDate: true },
                }),
            ]);
        const progress = progressNumber(totalTasks, completedTasks);
        const dueDate = dueDateAggregate._max.dueDate;

        const projectData = {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            projectRole: member.role,
            dueDate,
            members: project.members,
            totalMembers,
            progress,
        };

        return projectData;
    }

    static async updateProject(
        projectId: string,
        userId: string,
        data: { name?: string; description?: string; status?: ProjectStatus },
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
                "Only project owner can update project details",
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
                "Only project owner can delete this project",
            );
        }

        await prisma.project.delete({
            where: { id: projectId },
        });

        return { message: "Project deleted successfully" };
    }
}

export default ProjectService;
