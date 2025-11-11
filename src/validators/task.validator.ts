import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

const TaskStatusEnum = z.enum(TaskStatus);
const TaskPriorityEnum = z.enum(TaskPriority);

const create = z.object({
    title: z.string().min(5).max(200),
    description: z.string().max(1000).optional(),
    dueDate: z.coerce.date().optional(),
    priority: TaskPriorityEnum.optional().default("MEDIUM"),
    assigneeId: z.string().optional(),
});

const update = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(1000).optional(),
    dueDate: z.coerce.date().optional(),
    priority: TaskPriorityEnum.optional(),
    status: TaskStatusEnum.optional(),
    assigneeId: z.string().optional().nullable(),
});

const get = z.object({
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    assigneeId: z.string().or(z.literal("null")).optional(),
});

export type CreateTask = z.infer<typeof create>;
export type UpdateTask = z.infer<typeof update>;
export type TaskFilters = z.infer<typeof get>;

export default {
    create,
    update,
    get,
};
