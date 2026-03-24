import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import {
    EntityNotFound,
    ForbiddenError,
    UnauthorizedError,
    ValidationError,
} from "../errors";
import prisma from "../utils/prisma";
import { GetDataOptions } from "../utils/types";
import { CreateTask, UpdateTask } from "../validators/task.validator";

class TaskService {
    static async createTask(
        projectId: string,
        creatorId: string,
        data: CreateTask
    ) {
        // check if creator is a project member
        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: creatorId,
                },
            },
        });
        if (!member)
            throw new ForbiddenError("You are not the owner of this project");

        // if assigneeId is provided, verify they are a project member
        if (data.assigneeId) {
            const assigneeMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: data.assigneeId,
                    },
                },
            });

            if (!assigneeMember)
                throw new UnauthorizedError(
                    "Assignee is not a member of this project"
                );
        }

        // prevent duplicate names
        const taskExistsByName = await prisma.task.findFirst({
            where: {
                title: data.title,
                projectId,
            },
        });
        if (taskExistsByName)
            throw new ValidationError(
                "You already have a task with this name in this project"
            );

        // create task
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                priority: data.priority || "MEDIUM",
                projectId,
                creatorId,
                status: "TODO",
                ...(data.assigneeId && { assigneeId: data.assigneeId }),
            },
        });

        return { id: task.id, title: task.title, projectId: task.projectId };
    }

    static async getProjectTasks(
        projectId: string,
        userId: string,
        queryOptions: GetDataOptions,
        filters?: {
            status?: TaskStatus;
            assigneeId?: string;
            priority?: TaskPriority;
        }
    ) {
        const { limit } = queryOptions;

        // check if user is a project member
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

        //  build 'where' clause with possible filters
        const where: Prisma.TaskWhereInput = { projectId };
        if (filters?.status) where.status = filters.status;
        if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
        if (filters?.priority) where.priority = filters.priority;

        const tasks = await prisma.task.findMany({
            where,
            select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                description: true,
                assignee: { select: { firstName: true, lastName: true } },
                assigneeId: true,
                dueDate: true,
            },
            // include: {
            //     assignee: {
            //         select: {
            //             id: true,
            //             email: true,
            //             // username: true,
            //             // firstName: true,
            //             // lastName: true,
            //         },
            //     },
            //     creator: {
            //         select: {
            //             id: true,
            //             email: true,
            //             // username: true,
            //             // firstName: true,
            //             // lastName: true,
            //         },
            //     },
            // },
            orderBy: [{ createdAt: "desc" }],
            ...(limit && { take: limit }),
        });

        return tasks;
    }

    static async getProjectTask(
        projectId: string,
        taskId: string,
        userId: string
    ) {
        // check if user is a project member
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

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                projectId: true,
                description: true,
                assignee: {
                    select: { id: true, firstName: true, lastName: true },
                },
                creator: {
                    select: { id: true, firstName: true, lastName: true },
                },
                project: { select: { id: true, name: true } },
            },
        });
        if (!task || task.projectId !== projectId)
            throw new EntityNotFound("Task not found");

        return task;
    }

    static async updateTask(
        projectId: string,
        taskId: string,
        userId: string,
        data: UpdateTask
    ) {
        // check if user is a project member
        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        if (!member)
            throw new ForbiddenError("You are not a member of this project");

        // check if task exists in project
        const existingTask = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!existingTask || existingTask.projectId !== projectId)
            throw new EntityNotFound("Task not found");

        // if assigneeId provided, verify they are a project member
        if (data.assigneeId) {
            const assigneeMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: data.assigneeId,
                    },
                },
            });
            if (!assigneeMember)
                throw new ValidationError(
                    "Assignee is not a member of this project"
                );
        }

        // set completedAt if status is DONE
        const updateData: any = { ...data };
        if (data.status) {
            if (data.status === "DONE" && !existingTask.completedAt) {
                updateData.completedAt = new Date();
            } else if (data.status !== "DONE" && existingTask.completedAt) {
                updateData.completedAt = null;
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...updateData,
                ...(data.assigneeId && { assigneeId: data.assigneeId }),
            },
            select: {
                id: true,
                title: true,
                projectId: true,
            },
        });

        return updatedTask;
    }

    static async deleteTask(projectId: string, taskId: string, userId: string) {
        // check if user is a project member
        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        if (!member)
            throw new ForbiddenError("You are not a member of this project");

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!task || task.projectId !== projectId)
            throw new EntityNotFound("Task not found");

        if (member.role !== "OWNER" && task.creatorId !== userId)
            throw new ForbiddenError(
                "Only project owners or task creators can delete tasks"
            );

        await prisma.task.delete({
            where: { id: taskId },
        });

        return { message: "Task deleted successfully" };
    }

    // get tasks assigned to user across all projects
    static async getMyTasks(userId: string, queryOptions: GetDataOptions) {
        const {
            limit,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = queryOptions;

        const tasks = await prisma.task.findMany({
            where: {
                assigneeId: userId,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        email: true,
                        // username: true,
                        // firstName: true,
                        // lastName: true,
                    },
                },
            },
            // orderBy: [{ status: "asc" }, { dueDate: "asc" }],
            orderBy: {
                [sortBy]: sortOrder,
            },
            ...(limit && { take: limit }),
        });

        return tasks;
    }

    static async getOverdueTasks(userId: string) {
        const tasks = await prisma.task.findMany({
            where: {
                assigneeId: userId,
                status: { not: "DONE" },
                dueDate: { lt: new Date() },
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                dueDate: "asc",
            },
        });

        return tasks;
    }
}

export default TaskService;
