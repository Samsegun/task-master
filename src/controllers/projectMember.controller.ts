import { ProjectRole } from "@prisma/client";
import { Request, Response } from "express";
import ProjectMemberService from "../services/projectMember.service";
import asyncHandler from "../utils/asyncRequestHandler";
import { AddProjectMember } from "../validators/project.validator";

class ProjectMemberController {
    static addMember = asyncHandler(async (req: Request, res: Response) => {
        const requesterId = (req as any).userId;
        const { projectId } = req.params;
        const data = req.body as AddProjectMember;

        const newMember = await ProjectMemberService.addMember(
            projectId,
            requesterId,
            data
        );

        res.status(201).json({
            success: true,
            newMember,
        });
    });

    static getMembers = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId } = req.params;

        const projectMembers = await ProjectMemberService.getMembers(
            projectId,
            userId
        );

        res.status(200).json({
            success: true,
            projectMembers,
        });
    });

    static updateMemberRole = asyncHandler(
        async (req: Request, res: Response) => {
            const requesterId = (req as any).userId;
            const { projectId, userIdToUpdate } = req.params;
            const { role } = req.body as { role: ProjectRole };

            const updatedMember = await ProjectMemberService.updateMemberRole(
                projectId,
                userIdToUpdate,
                requesterId,
                role
            );

            res.status(200).json({
                success: true,
                updatedMember,
            });
        }
    );

    static removeMember = asyncHandler(async (req: Request, res: Response) => {
        const requesterId = (req as any).userId;
        const { projectId, userIdToRemove } = req.params;

        const result = await ProjectMemberService.removeMember(
            projectId,
            userIdToRemove,
            requesterId
        );

        res.status(200).json({
            success: true,
            message: result.message,
        });
    });

    static leaveProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId } = req.params;

        const result = await ProjectMemberService.leaveProject(
            projectId,
            userId
        );

        res.status(200).json({
            success: true,
            message: result.message,
        });
    });
}

export default ProjectMemberController;
