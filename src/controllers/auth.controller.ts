import { Request, Response } from "express";
import { ValidationError } from "../errors";
import AuthService from "../services/auth.service";
import TokenService from "../services/token.service";
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
        TokenService.setAuthCookies(res, accessToken, refreshToken);

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

        if (refreshToken) await TokenService.deleteRefreshToken(refreshToken);

        // always clear cookies (even if token didn't exist)
        TokenService.clearAuthCookies(res);
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

            // set cookies
            TokenService.setAuthCookies(res, accessToken, refreshToken);

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

            const { accessToken, refreshToken, userDetails } =
                await AuthService.verifyUserMail(token);

            // set cookies
            TokenService.setAuthCookies(res, accessToken, refreshToken);

            res.status(200).json({
                success: true,
                message: "Email verified successfully. You can now sign in.",
                user: {
                    ...userDetails,
                },
            });
        }
    );

    static forgotPassword = asyncHandler(
        async (req: Request, res: Response) => {
            const { email } = req.body as { email: string };

            const resetPasswordMailSent = await AuthService.forgotPassword(
                email
            );

            // trying not to reveal if email exists or not because of attackers
            if (!resetPasswordMailSent.success) {
                res.status(200).json({
                    success: true,
                    message:
                        "If an account with this email exists, a password reset link has been sent.",
                });
            }

            res.status(200).json({
                success: resetPasswordMailSent.success,
                message:
                    "If an account with this email exists, a password reset link has been sent.",
            });
        }
    );

    static resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { token, password } = req.body as {
            token: string;
            password: string;
        };

        if (!token || !password)
            throw new ValidationError("Invalid reset details");

        const passwordUpdated = await AuthService.resetPassword(
            token,
            password
        );

        TokenService.clearAuthCookies(res);

        res.status(200).json({
            success: passwordUpdated.success,
            message:
                "Password reset successful. Please log in with your new password",
        });
    });
}

export default AuthController;
