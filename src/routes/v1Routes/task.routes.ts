import { Router } from "express";
import TaskController from "../../controllers/task.controller";
import TaskValidator from "../../validators/task.validator";
import { validateData } from "../../validators/validateData";
import { validateRequestQuery } from "../../validators/validateRequestQuery";

const taskRouter = Router({ mergeParams: true });

const { create, get } = TaskValidator;
const { getProjectTasks, getProjectTask, createTask } = TaskController;

/** ON-HOLD!!!
// user tasks across all projects
taskRouter.get("/my-tasks", (req, res) => {
    res.send("hello from all tasks");
});
*/

// project-tasks specific to a project
taskRouter.get("/", validateRequestQuery(get), getProjectTasks);

taskRouter.get("/:taskId", getProjectTask);

taskRouter.post("/", validateData(create), createTask);

taskRouter.patch("/:taskId", (req, res) => {
    res.send("hello from update task");
});

taskRouter.delete("/:taskId", (req, res) => {
    res.send("hello from delete task");
});

export default taskRouter;
