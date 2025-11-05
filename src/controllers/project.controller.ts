import { Request, Response } from "express";
// import { ValidationError } from "../errors";
// import AuthService from "../services/auth.service";
// import TokenService from "../services/token.service";
import asyncHandler from "../utils/asyncRequestHandler";
// import { ValidatedAuthRequest } from "../utils/types";

class ProjectController {
    static createProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        console.log(req.body);

        console.log(userId);

        res.send("hello from create project");
    });
}

export default ProjectController;
