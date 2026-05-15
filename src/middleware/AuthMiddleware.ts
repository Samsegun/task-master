import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../errors";
import prisma from "../utils/prisma";
import {
    verifyAccessToken,
    verifyInvitationToken,
    verifyRefreshToken,
} from "../utils/tokenManagement";
import {
    InvitationTokenPayload,
    JwtPayload,
    RefreshTokenPayload,
} from "../utils/types";

class AuthMiddleware {
    static authenticateUser = (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const accessToken = req.cookies.accessToken;
        if (!accessToken)
            // user should be logged out!!!
            throw new UnauthorizedError(
                "Authentication required",
                "TOKEN_MISSING",
            );

        try {
            const { userId } = verifyAccessToken(accessToken) as JwtPayload;

            (req as any).userId = userId;
            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                // specific signal for frontend to renew tokens
                throw new UnauthorizedError("Token expired", "TOKEN_EXPIRED");
            } else if (error instanceof jwt.JsonWebTokenError) {
                // user should be logged out!!!
                throw new UnauthorizedError("Invalid token", "TOKEN_INVALID");
            } else {
                // fallback for other errors
                // user can retry
                throw new UnauthorizedError(
                    "Authentication failed",
                    "AUTH_FAILED",
                );
            }
        }
    };

    static refreshTokenValidation = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            // user should be logged out!!!
            throw new UnauthorizedError(
                "Refresh token required",
                "REFRESH_TOKEN_MISSING",
            );
        }

        try {
            const { userId, tokenId } = verifyRefreshToken(
                refreshToken,
            ) as RefreshTokenPayload;

            (req as any).userInfo = { userId, tokenId };
            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                // user should be logged out!!!
                throw new UnauthorizedError(
                    "Token expired",
                    "REFRESH_TOKEN_EXPIRED",
                );
            } else if (error instanceof jwt.JsonWebTokenError) {
                // user should be logged out!!!
                throw new UnauthorizedError(
                    "Invalid token",
                    "REFRESH_TOKEN_INVALID",
                );
            } else {
                // user should be logged out!!!
                // user can retry
                throw new UnauthorizedError(
                    "Authentication failed",
                    "REFRESH_AUTH_FAILED",
                );
            }
        }
    };

    static validateInvitationToken = (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const { token } = req.body;

        if (!token) throw new ForbiddenError("Invalid operation!");

        try {
            // verify token
            const invitationPayload = verifyInvitationToken(
                token,
            ) as InvitationTokenPayload;

            (req as any).invitationPayload = invitationPayload;
            next();
        } catch (error: any) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedError("Token expired", "TOKEN_EXPIRED");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedError("Invalid token", "TOKEN_INVALID");
            } else {
                throw error;
            }
        }
    };

    static authorizeNonUser = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const userId = (req as any).userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) throw new UnauthorizedError("Authentication required");

        const allowedRoles = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];

        if (!allowedRoles.includes(user.role)) {
            throw new UnauthorizedError(
                "Access denied: elevated role required",
            );
        }

        next();
    };
}

export default AuthMiddleware;
