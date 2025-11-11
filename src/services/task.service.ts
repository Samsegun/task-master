import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { EntityNotFound, ForbiddenError, ValidationError } from "../errors";
import prisma from "../utils/prisma";
import { CreateTask } from "../validators/task.validator";

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
            throw new ForbiddenError("You are not a member of this project");

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
                assigneeId: data.assigneeId,
                projectId,
                creatorId,
                status: "TODO",
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        email: true,
                        // username: true,
                        // firstName: true,
                        // lastName: true,
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
        });

        return task;
    }

    static async getProjectTasks(
        projectId: string,
        userId: string,
        filters?: {
            status?: TaskStatus;
            assigneeId?: string;
            priority?: TaskPriority;
        }
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

        //  build 'where' clause with possible filters
        // const where: any = { projectId };
        const where: Prisma.TaskWhereInput = { projectId };

        if (filters?.status) where.status = filters.status;
        if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
        if (filters?.priority) where.priority = filters.priority;

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignee: {
                    select: {
                        id: true,
                        email: true,
                        // username: true,
                        // firstName: true,
                        // lastName: true,
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
            orderBy: [
                { status: "asc" },
                { priority: "desc" },
                { createdAt: "desc" },
            ],
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
            include: {
                assignee: {
                    select: {
                        id: true,
                        email: true,
                        // username: true,
                        // firstName: true,
                        // lastName: true,
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
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!task || task.projectId !== projectId)
            throw new EntityNotFound("Task not found");

        return task;
    }
}

export default TaskService;
