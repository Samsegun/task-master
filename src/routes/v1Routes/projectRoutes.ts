import { Router } from "express";
import ProjectController from "../../controllers/project.controller";
import projectValidator from "../../validators/project.validator";
import { validateData } from "../../validators/validateData";

const projectRouter = Router();

projectRouter.get("/", ProjectController.getUserProjects);

projectRouter.post(
    "/",
    validateData(projectValidator.create),
    ProjectController.createProject
);

projectRouter.get("/:projectId", ProjectController.getProject);

projectRouter.patch(
    "/:projectId",
    validateData(projectValidator.update),
    ProjectController.updateProject
);

projectRouter.delete("/:projectId", ProjectController.deleteProject);

export default projectRouter;
