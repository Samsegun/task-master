import { Router } from "express";
import TaskController from "../../controllers/task.controller";

const userRouter = Router();

userRouter.get("/me", (req, res) => {
    const userId = (req as any).userId;

    res.send(`hello from user ${userId}`);
});

// user tasks across all projects
userRouter.get("/me/tasks", TaskController.getMyTasks);

export default userRouter;
