import { Router } from "express";
import TaskController from "../../controllers/task.controller";
import TaskValidator from "../../validators/task.validator";
import { validateData } from "../../validators/validateData";
import { validateRequestQuery } from "../../validators/validateRequestQuery";

const taskRouter = Router({ mergeParams: true });

const { create, get, update } = TaskValidator;
const { getProjectTasks, getProjectTask, createTask, updateTask, deleteTask } =
    TaskController;

// project-tasks specific to a project
taskRouter.get("/", validateRequestQuery(get), getProjectTasks);

taskRouter.get("/:taskId", getProjectTask);

taskRouter.post("/", validateData(create), createTask);

taskRouter.patch("/:taskId", validateData(update), updateTask);

taskRouter.delete("/:taskId", deleteTask);

export default taskRouter;
