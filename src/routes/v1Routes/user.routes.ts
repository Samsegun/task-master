import { Router } from "express";
import TaskController from "../../controllers/task.controller";
import UserController from "../../controllers/user.controller";

const userRouter = Router();

const { getMyTasks, getOverdueTasks } = TaskController;
const { getAuthStatus } = UserController;

userRouter.get("/", getAuthStatus);

// user tasks across all projects
userRouter.get("/tasks", getMyTasks);
userRouter.get("/tasks/overdue", getOverdueTasks);

export default userRouter;
