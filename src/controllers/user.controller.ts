// controllers/user.controller.ts
import { Request, Response } from "express";
import UserService from "../services/user.service";
import asyncHandler from "../utils/asyncRequestHandler";

class UserController {
    static getAuthStatus = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;

        const user = await UserService.getAuthStatus(userId);

        res.status(200).json({
            success: true,
            data: user,
        });
    });
}

export default UserController;
