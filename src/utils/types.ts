import { User as PrismaUser } from "@prisma/client";

interface ValidationError extends Error {
    statusCode?: number;
    data?: { field: string; message: string }[];
}

type ValidatedRegisterRequest = {
    email: string;
    password: string;
    username: string;
};

type ValidatedLoginRequest = {
    emailOrusername: string;
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

interface GetDataOptions {
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export {
    GetDataOptions,
    JwtPayload,
    RefreshTokenPayload,
    User,
    ValidatedLoginRequest,
    ValidatedRegisterRequest,
    ValidationError,
};
