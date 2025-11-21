import { Response } from "express";
import { randomUUID } from "node:crypto";

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
    static async createAuthTokens(userId: string, isVerified: boolean) {
        // generate tokens
        const accessToken = generateAccessToken({
            userId,
            isVerified,
        });

        const refreshTokenId = randomUUID();
        const refreshToken = generateRefreshToken({
            userId,
            tokenId: refreshTokenId,
        });

        // store refresh token in db
        const token = await prisma.refreshToken.create({
            data: {
                id: refreshTokenId,
                token: refreshToken,
                userId,
                expiresAt: new Date(
                    Date.now() + authConfig.refreshTokenExpiryTime
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
