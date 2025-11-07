import { Router } from "express";
import ProjectController from "../../controllers/project.controller";
import ProjectMemberController from "../../controllers/projectMember.controller";
import projectValidator from "../../validators/project.validator";
import { validateData } from "../../validators/validateData";

const projectRouter = Router();

// === project routes ===
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

// === project member routes ===
projectRouter.post(
    "/:projectId/members",
    validateData(projectValidator.addMember),
    ProjectMemberController.addMember
);

projectRouter.get("/:projectId/members", ProjectMemberController.getMembers);

projectRouter.patch(
    "/:projectId/members/:userIdToUpdate",
    validateData(projectValidator.updateMemberRole),
    ProjectMemberController.updateMemberRole
);

projectRouter.delete(
    "/:projectId/members/:userIdToRemove",
    ProjectMemberController.removeMember
);

projectRouter.delete("/:projectId/leave", ProjectMemberController.leaveProject);

export default projectRouter;
