import { Router } from "express";
import ProjectController from "../../controllers/project.controller";
import ProjectMemberController from "../../controllers/projectMember.controller";
import ValidationMiddleware from "../../middleware/ValidationMiddleware";
import projectValidator from "../../validators/project.validator";
import taskRouter from "./task.routes";

const projectRouter = Router();

const {
    getUserProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
} = ProjectController;

const { addMember, getMembers, updateMemberRole, removeMember, leaveProject } =
    ProjectMemberController;
const { validateBodyData } = ValidationMiddleware;

// ****************** task routes ******************
projectRouter.use("/:projectId/tasks", taskRouter);

// ****************** project member routes ******************
projectRouter.post(
    "/:projectId/members",
    validateBodyData(projectValidator.addMember),
    addMember
);

projectRouter.get("/:projectId/members", getMembers);

projectRouter.patch(
    "/:projectId/members/:userIdToUpdate",
    validateBodyData(projectValidator.updateMemberRole),
    updateMemberRole
);

projectRouter.delete("/:projectId/members/:userIdToRemove", removeMember);

projectRouter.delete("/:projectId/leave", leaveProject);

// ****************** project routes ******************
projectRouter.get("/", getUserProjects);

projectRouter.post(
    "/",
    validateBodyData(projectValidator.create),
    createProject
);

projectRouter.get("/:projectId", getProject);

projectRouter.patch(
    "/:projectId",
    validateBodyData(projectValidator.update),
    updateProject
);

projectRouter.delete("/:projectId", deleteProject);

export default projectRouter;
