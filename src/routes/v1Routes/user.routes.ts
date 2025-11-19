import { Router } from "express";
import TaskController from "../../controllers/task.controller";

const userRouter = Router();

const { getMyTasks, getOverdueTasks } = TaskController;

userRouter.get("/", (req, res) => {
    const userId = (req as any).userId;

    res.send(`hello from user ${userId}`);
});

// user tasks across all projects
userRouter.get("/tasks", getMyTasks);
userRouter.get("/tasks/overdue", getOverdueTasks);

export default userRouter;
