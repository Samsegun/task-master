import { ForbiddenError, ValidationError } from "../errors";
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
}

export default TaskService;
