import { Router } from "express";
import TaskController from "../../controllers/task.controller";
import UserController from "../../controllers/user.controller";
import ValidationMiddleware from "../../middleware/ValidationMiddleware";
import taskValidator from "../../validators/task.validator";

const userRouter = Router();

const { getMyTasks, getOverdueTasks } = TaskController;
const { getAuthStatus } = UserController;
const { validateRequestQuery } = ValidationMiddleware;
const { get } = taskValidator;

userRouter.get("/", getAuthStatus);

// user tasks across all projects
userRouter.get("/tasks", validateRequestQuery(get), getMyTasks);
userRouter.get("/tasks/overdue", getOverdueTasks);

export default userRouter;
