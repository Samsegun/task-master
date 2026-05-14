import { Router } from "express";
import ProjectController from "../../controllers/project.controller";
import ProjectMemberController from "../../controllers/projectMember.controller";
import ValidationMiddleware from "../../middleware/ValidationMiddleware";
import projectValidator from "../../validators/project.validator";
import taskRouter from "./task.routes";
import AuthMiddleware from "../../middleware/AuthMiddleware";

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
const { validateBodyData, validateRequestQuery } = ValidationMiddleware;
const { validateInvitationToken } = AuthMiddleware;

// ****************** task routes ******************
projectRouter.use("/:projectId/tasks", taskRouter);

// ****************** project member routes ******************

projectRouter.post(
    "/:projectId/members/invite",
    validateBodyData(projectValidator.addMember),
    ProjectMemberController.inviteMember,
);

projectRouter.post(
    "/invitations/accept",
    validateInvitationToken,
    ProjectMemberController.acceptInvitation,
);

projectRouter.post(
    "/invitations/decline",
    validateInvitationToken,
    ProjectMemberController.declineInvitation,
);

projectRouter.post(
    "/:projectId/members",
    validateBodyData(projectValidator.addMember),
    addMember,
);

// get members of a project
projectRouter.get("/:projectId/members", getMembers);

// update member role
projectRouter.patch(
    "/:projectId/members/:userIdToUpdate",
    validateBodyData(projectValidator.updateMemberRole),
    updateMemberRole,
);

projectRouter.delete("/:projectId/members/:userIdToRemove", removeMember);

projectRouter.delete("/:projectId/leave", leaveProject);

// ****************** project routes ******************
projectRouter.get(
    "/",
    validateRequestQuery(projectValidator.getProjects),
    getUserProjects,
);

projectRouter.post(
    "/",
    validateBodyData(projectValidator.create),
    createProject,
);

projectRouter.get("/:projectId", getProject);

projectRouter.patch(
    "/:projectId",
    validateBodyData(projectValidator.update),
    updateProject,
);

projectRouter.delete("/:projectId", deleteProject);

export default projectRouter;
