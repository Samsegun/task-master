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

            const tasks = await TaskService.getProjectTasks(
                projectId,
                userId,
                filters
            );

            res.status(200).json({
                success: true,
                tasks,
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
            task,
        });
    });
}

export default TaskController;
