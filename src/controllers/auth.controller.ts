import { Request, Response } from "express";
import { ValidationError } from "../errors";
import AuthService from "../services/auth.service";
import { tokenService } from "../services/token.service";
import asyncHandler from "../utils/asyncRequestHandler";
import { ValidatedAuthRequest } from "../utils/types";

class AuthController {
    static createUser = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body as ValidatedAuthRequest;

        const newUser = await AuthService.createUser(email, password);

        res.status(201).json({
            success: true,
            message: "User created. Please check email to verify account",
            user: newUser,
        });
    });

    static loginUser = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body as ValidatedAuthRequest;

        const { accessToken, refreshToken, user } = await AuthService.loginUser(
            email,
            password
        );

        // set cookies
        await tokenService.setAuthCookies(res, accessToken, refreshToken);
        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    });

    static logoutUser = asyncHandler(async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;

        await tokenService.deleteRefreshToken(refreshToken);

        // always clear cookies (even if token didn't exist)
        tokenService.clearAuthCookies(res);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    });

    static refreshAccessToken = asyncHandler(
        async (req: Request, res: Response) => {
            const userInfo = (req as any).userInfo;

            const { accessToken, refreshToken } =
                await AuthService.refreshToken(userInfo);

            // // set cookies
            await tokenService.setAuthCookies(res, accessToken, refreshToken);

            res.status(200).json({
                success: true,
                message: "Tokens refreshed successfully",
            });
        }
    );

    static verifyUserMail = asyncHandler(
        async (req: Request, res: Response) => {
            const { token } = req.query;

            if (!token || typeof token !== "string") {
                throw new ValidationError("Invalid token");
            }

            const { accessToken, refreshToken } =
                await AuthService.verifyUserMail(token);

            // set cookies
            await tokenService.setAuthCookies(res, accessToken, refreshToken);

            res.status(200).json({
                success: true,
                message: "Email verified successfully. You can now sign in.",
            });
        }
    );
}

export default AuthController;
