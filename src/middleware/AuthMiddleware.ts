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
            // user should be logged out!!!
            throw new UnauthorizedError(
                "Authentication required",
                "TOKEN_MISSING"
            );
        }

        try {
            const { userId } = verifyAccessToken(accessToken) as JwtPayload;

            (req as any).userId = userId;
            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                // specific signal for frontend to indicate expired token
                throw new UnauthorizedError("Token expired", "TOKEN_EXPIRED");
            } else if (error instanceof jwt.JsonWebTokenError) {
                // user should be logged out!!!
                throw new UnauthorizedError("Invalid token", "TOKEN_INVALID");
            } else {
                // fallback for other errors
                // user can retry
                throw new UnauthorizedError(
                    "Authentication failed",
                    "AUTH_FAILED"
                );
            }
        }
    };

    static refreshTokenValidation = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            // user should be logged out!!!
            throw new UnauthorizedError("No token provided");
        }

        try {
            const { userId, tokenId } = verifyRefreshToken(
                refreshToken
            ) as RefreshTokenPayload;

            (req as any).userInfo = { userId, tokenId };
            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                // user should be logged out!!!
                throw new UnauthorizedError(
                    "Token expired",
                    "REFRESH_TOKEN_EXPIRED"
                );
            } else if (error instanceof jwt.JsonWebTokenError) {
                // user should be logged out!!!
                throw new UnauthorizedError(
                    "Invalid token",
                    "REFRESH_TOKEN_INVALID"
                );
            } else {
                // user should be logged out!!!
                // user can retry
                throw new UnauthorizedError(
                    "Authentication failed",
                    "REFRESH_AUTH_FAILED"
                );
            }
        }
    };
}

export default AuthMiddleware;
