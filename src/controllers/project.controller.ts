import { Request, Response } from "express";
import ProjectService from "../services/project.service";
import asyncHandler from "../utils/asyncRequestHandler";
import { CreateProject, UpdateProject } from "../validators/project.validator";

class ProjectController {
    static createProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { name, description } = req.body as CreateProject;

        const project = await ProjectService.createProject(userId, {
            name,
            description,
        });

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    });

    static getUserProjects = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).userId;

            const projects = await ProjectService.getUserProjects(userId);

            res.status(200).json({
                success: true,
                projects,
            });
        }
    );

    static getProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId } = req.params;

        const project = await ProjectService.getProjectById(projectId, userId);

        res.status(200).json({
            success: true,
            data: project,
        });
    });

    static updateProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId } = req.params;
        const data = req.body as UpdateProject;

        const project = await ProjectService.updateProject(projectId, userId, {
            ...data,
        });

        res.status(200).json({
            success: true,
            data: project,
        });
    });

    static deleteProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId } = req.params;

        const result = await ProjectService.deleteProject(projectId, userId);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    });
}

export default ProjectController;
