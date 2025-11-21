import { Router } from "express";
import TaskController from "../../controllers/task.controller";
import ValidationMiddleware from "../../middleware/ValidationMiddleware";
import TaskValidator from "../../validators/task.validator";

const taskRouter = Router({ mergeParams: true });

const { create, get, update } = TaskValidator;
const { getProjectTasks, getProjectTask, createTask, updateTask, deleteTask } =
    TaskController;
const { validateBodyData, validateRequestQuery } = ValidationMiddleware;

// tasks specific to a project
taskRouter.get("/", validateRequestQuery(get), getProjectTasks);

taskRouter.get("/:taskId", getProjectTask);

taskRouter.post("/", validateBodyData(create), createTask);

taskRouter.patch("/:taskId", validateBodyData(update), updateTask);

taskRouter.delete("/:taskId", deleteTask);

export default taskRouter;
