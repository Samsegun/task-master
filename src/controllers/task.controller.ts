import { Request, Response } from "express";
import TaskService from "../services/task.service";
import asyncHandler from "../utils/asyncRequestHandler";
import {
    CreateTask,
    TaskFilters,
    UpdateTask,
} from "../validators/task.validator";

class TaskController {
    static createTask = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const data = req.body as CreateTask;
        const { projectId } = req.params;

        const task = await TaskService.createTask(projectId, userId, data);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task,
        });
    });

    static getProjectTasks = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).userId;

            const { projectId } = req.params;
            const filters: TaskFilters = req.query;
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : undefined;

            const tasks = await TaskService.getProjectTasks(
                projectId,
                userId,
                { limit },
                filters
            );

            res.status(200).json({
                success: true,
                tasks,
                userId,
            });
        }
    );

    static getProjectTask = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).userId;
            const { projectId, taskId } = req.params;

            const task = await TaskService.getProjectTask(
                projectId,
                taskId,
                userId
            );

            res.status(200).json({
                success: true,
                task,
            });
        }
    );

    static updateTask = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId, taskId } = req.params;
        const data = req.body as UpdateTask;

        const task = await TaskService.updateTask(
            projectId,
            taskId,
            userId,
            data
        );

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task,
        });
    });

    static deleteTask = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId, taskId } = req.params;

        const result = await TaskService.deleteTask(projectId, taskId, userId);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    });

    static getMyTasks = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;

        // parse query parameters
        const limit = req.query.limit
            ? parseInt(req.query.limit as string)
            : undefined;
        const sort = req.query.sort as string;

        // parse sort (like "assignedAt:desc" or "createdAt:asc")
        let sortBy = "createdAt";
        let sortOrder: "asc" | "desc" = "desc";

        if (sort) {
            const [field, order] = sort.split(":");
            if (field) sortBy = field;
            if (order === "asc" || order === "desc") sortOrder = order;
        }

        const tasks = await TaskService.getMyTasks(userId, {
            limit,
            sortBy,
            sortOrder,
        });

        res.status(200).json({
            success: true,
            tasks,
        });
    });

    static getOverdueTasks = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).userId;

            const tasks = await TaskService.getOverdueTasks(userId);

            res.status(200).json({
                success: true,
                data: tasks,
            });
        }
    );
}

export default TaskController;
