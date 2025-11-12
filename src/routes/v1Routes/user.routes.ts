import { Router } from "express";
import TaskController from "../../controllers/task.controller";

const userRouter = Router();

userRouter.get("/", (req, res) => {
    const userId = (req as any).userId;

    res.send(`hello from user ${userId}`);
});

// user tasks across all projects
userRouter.get("/tasks", TaskController.getMyTasks);
userRouter.get("/tasks/overdue", TaskController.getOverdueTasks);

export default userRouter;
