import { Request, Response } from "express";
import TaskService from "../services/task.service";
import asyncHandler from "../utils/asyncRequestHandler";
import { CreateTask } from "../validators/task.validator";

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
}

export default TaskController;
