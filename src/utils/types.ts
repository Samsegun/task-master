import { User as PrismaUser } from "@prisma/client";

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
    isVerified: boolean;
}

interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
}

type User = Omit<PrismaUser, "password">;

export {
    JwtPayload,
    RefreshTokenPayload,
    User,
    ValidatedAuthRequest,
    ValidationError,
};
