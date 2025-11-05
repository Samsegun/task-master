import { Request, Response } from "express";
// import { ValidationError } from "../errors";
// import AuthService from "../services/auth.service";
// import TokenService from "../services/token.service";
import ProjectService from "../services/project.service";
import asyncHandler from "../utils/asyncRequestHandler";
import { CreateProject } from "../validators/project.validator";
// import { ValidatedAuthRequest } from "../utils/types";

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

            res.status(201).json({
                success: true,
                projects,
            });
        }
    );
}

export default ProjectController;
