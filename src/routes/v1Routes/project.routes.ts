import { Router } from "express";
import ProjectController from "../../controllers/project.controller";
import ProjectMemberController from "../../controllers/projectMember.controller";
import projectValidator from "../../validators/project.validator";
import { validateData } from "../../validators/validateData";
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

// ****************** task routes ******************
projectRouter.use("/:projectId/tasks", taskRouter);

// ****************** project member routes ******************
projectRouter.post(
    "/:projectId/members",
    validateData(projectValidator.addMember),
    addMember
);

projectRouter.get("/:projectId/members", getMembers);

projectRouter.patch(
    "/:projectId/members/:userIdToUpdate",
    validateData(projectValidator.updateMemberRole),
    updateMemberRole
);

projectRouter.delete("/:projectId/members/:userIdToRemove", removeMember);

projectRouter.delete("/:projectId/leave", leaveProject);

// ****************** project routes ******************
projectRouter.get("/", getUserProjects);

projectRouter.post("/", validateData(projectValidator.create), createProject);

projectRouter.get("/:projectId", getProject);

projectRouter.patch(
    "/:projectId",
    validateData(projectValidator.update),
    updateProject
);

projectRouter.delete("/:projectId", deleteProject);

export default projectRouter;
