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

export {
    JwtPayload,
    RefreshTokenPayload,
    ValidatedAuthRequest,
    ValidationError,
};
