import { Router } from "express";
import TaskController from "../../controllers/task.controller";
import TaskValidator from "../../validators/task.validator";
import { validateData } from "../../validators/validateData";

const taskRouter = Router({ mergeParams: true });

/** ON-HOLD!!!
// user tasks across all projects
taskRouter.get("/my-tasks", (req, res) => {
    res.send("hello from all tasks");
});
*/

// user tasks specific to a project
taskRouter.get("/", (req, res) => {
    res.send("hello from project tasks");
});

taskRouter.get("/:taskId", (req, res) => {
    res.send("hello from task id");
});

taskRouter.post(
    "/",
    validateData(TaskValidator.create),
    TaskController.createTask
);

taskRouter.patch("/:taskId", (req, res) => {
    res.send("hello from update task");
});

taskRouter.delete("/:taskId", (req, res) => {
    res.send("hello from delete task");
});

export default taskRouter;
