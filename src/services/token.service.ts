import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
    accessTokenCookieOptions,
    authConfig,
    baseCookieOptions,
    refreshTokenCookieOptions,
} from "../config/auth.config";
import prisma from "../utils/prisma";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../utils/tokenManagement";

class TokenService {
    static async createAuthTokens(
        userId: string,
        role: string,
        isVerified: boolean
    ) {
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

    static async revokeRefreshToken(tokenId: string) {
        await prisma.refreshToken.update({
            where: { id: tokenId },
            data: { isRevoked: true },
        });
    }

    static setAuthCookies(
        res: Response,
        accessToken: string,
        refreshToken: string
    ) {
        res.cookie("accessToken", accessToken, accessTokenCookieOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
    }

    static clearAuthCookies(res: Response) {
        res.clearCookie("accessToken", { ...baseCookieOptions, maxAge: 0 });
        res.clearCookie("refreshToken", {
            ...baseCookieOptions,
            path: "/api/auth",
            maxAge: 0,
        });
    }

    static async deleteRefreshToken(refreshToken: string) {
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
}

export default TokenService;
