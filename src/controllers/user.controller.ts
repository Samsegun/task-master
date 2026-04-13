import { Request, Response } from "express";
import UserService from "../services/user.service";
import asyncHandler from "../utils/asyncRequestHandler";
import { UpdatePassword, UpdateProfile } from "../validators/user.validator";

class UserController {
    static getAuthStatus = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;

        const user = await UserService.getAuthStatus(userId);

        res.status(200).json({
            success: true,
            data: user,
        });
    });

    static updateUserProfile = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).userId;
            const userDetailsToUpdate = req.body as UpdateProfile;

            const user = await UserService.updateUserProfile(userId, {
                ...userDetailsToUpdate,
            });

            res.status(200).json({
                success: true,
                data: user,
            });
        }
    );

    // not same as reset password
    // this action can only be performed by an authenticated user
    static updateUserPassword = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).userId;
            const userPasswordToUpdate = req.body as UpdatePassword;

            const passwordUpdated = await UserService.updateUserPassword(
                userId,
                { ...userPasswordToUpdate }
            );

            res.status(200).json({
                success: true,
                message: passwordUpdated.message,
            });
        }
    );
}

export default UserController;
