import { Router } from "express";
import ProjectController from "../../controllers/project.controller";
import projectValidator from "../../validators/project.validator";
import { validateData } from "../../validators/validateData";

const projectRouter = Router();

projectRouter.get("/", ProjectController.getUserProjects);

projectRouter.get("/:id", (req, res) => {
    const { id } = req.params;

    res.send(`hello from specific project ${id}`);
});

projectRouter.post(
    "/",
    validateData(projectValidator.create),
    ProjectController.createProject
);

export default projectRouter;
