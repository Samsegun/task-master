import { User as PrismaUser, Role } from "@prisma/client";

interface ValidationError extends Error {
    statusCode?: number;
    data?: { field: string; message: string }[];
}

type ValidatedAuthRequest = {
    email: string;
    password: string;
};

interface JwtPayload {
    userId: string;
    role: string;
    isVerified: boolean;
}

interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
}

type User = Omit<PrismaUser, "password">;
type RefreshTokenUser = {
    id: string;
    role: Role;
    isVerified: boolean;
    refreshTokens: {
        id: string;
        isRevoked: boolean;
    }[];
};

type refreshToken = {
    id: string;
    createdAt: Date;
    token: string;
    userId: string;
    isRevoked: boolean;
    expiresAt: Date;
};

export {
    JwtPayload,
    refreshToken,
    RefreshTokenPayload,
    RefreshTokenUser,
    User,
    ValidatedAuthRequest,
    ValidationError,
};
