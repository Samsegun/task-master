import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { authConfig } from "../config/auth.config";
import prisma from "../utils/prisma";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../utils/tokenManagement";

class TokenService {
    async createAuthTokens(userId: string, role: string, isVerified: boolean) {
        // 1. Generate tokens
        const accessToken = generateAccessToken({
            userId,
            role,
            isVerified,
        });

        const refreshTokenId = uuidv4();
        const refreshToken = generateRefreshToken({
            userId,
            tokenId: refreshTokenId,
        });

        // 2. Store refresh token in database
        const token = await prisma.refreshToken.create({
            data: {
                id: refreshTokenId,
                token: refreshToken,
                userId,
                expiresAt: new Date(
                    Date.now() +
                        authConfig.refreshTokenExpiryTime * 24 * 60 * 60 * 1000
                ),
            },
        });
        if (!token)
            throw Error("Failed to create token. Please try again later.");

        return { accessToken, refreshToken };
    }

    async revokeRefreshToken(tokenId: string) {
        await prisma.refreshToken.update({
            where: { id: tokenId },
            data: { isRevoked: true },
        });
    }

    async clearAuthCookies(res: Response) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
    }
}

export const tokenService = new TokenService();
