import { z } from "zod";

const TaskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

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

export type CreateTask = z.infer<typeof create>;
export type UpdateTask = z.infer<typeof update>;

export default {
    create,
    update,
    TaskStatusEnum,
    TaskPriorityEnum,
};
