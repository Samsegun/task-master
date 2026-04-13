import { Router } from "express";
import TaskController from "../../controllers/task.controller";
import UserController from "../../controllers/user.controller";
import ValidationMiddleware from "../../middleware/ValidationMiddleware";
import taskValidator from "../../validators/task.validator";
import userValidator from "../../validators/user.validator";

const userRouter = Router();

const { getAuthStatus, updateUserProfile, updateUserPassword } = UserController;
const { getMyTasks, getOverdueTasks } = TaskController;
const { validateRequestQuery, validateBodyData } = ValidationMiddleware;
const { get } = taskValidator;
const { updateProfile, updatePassword } = userValidator;

// user profile
userRouter.get("/", getAuthStatus);
userRouter.patch("/", validateBodyData(updateProfile), updateUserProfile);
userRouter.patch(
    "/password",
    validateBodyData(updatePassword),
    updateUserPassword
);

// user tasks across all projects
userRouter.get("/tasks", validateRequestQuery(get), getMyTasks);
userRouter.get("/tasks/overdue", getOverdueTasks);

export default userRouter;
