import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors";
import {
    verifyAccessToken,
    verifyRefreshToken,
} from "../utils/tokenManagement";
import { JwtPayload, RefreshTokenPayload } from "../utils/types";

class AuthMiddleware {
    static authenticateUser = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            throw new UnauthorizedError("No token provided", "TOKEN_MISSING");
        }

        try {
            const { userId } = verifyAccessToken(accessToken) as JwtPayload;

            (req as any).userId = userId;
            next();
        } catch (error) {
            console.error("Authentication failed: ", error);

            // specific signal for frontend to indicate expired token
            if (error instanceof jwt.TokenExpiredError)
                throw new UnauthorizedError("Token expired", "TOKEN_EXPIRED");

            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedError("Invalid token", "TOKEN_INVALID");
            }

            // fallback for other errors
            throw new UnauthorizedError("Authentication failed", "AUTH_FAILED");
        }
    };

    static refreshTokenValidation = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new UnauthorizedError("No token provided");
        }

        try {
            const { userId } = verifyRefreshToken(
                refreshToken
            ) as RefreshTokenPayload;

            (req as any).userId = userId;
            next();
        } catch (error) {
            console.error("Authentication failed:", error);

            if (error instanceof jwt.TokenExpiredError)
                throw new UnauthorizedError(
                    "Token expired",
                    "REFRESH_TOKEN_EXPIRED"
                );

            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedError(
                    "Invalid token",
                    "REFRESH_TOKEN_INVALID"
                );
            }

            // fallback for other errors
            throw new UnauthorizedError(
                "Authentication failed",
                "REFRESH_AUTH_FAILED"
            );
        }
    };
}

export default AuthMiddleware;
