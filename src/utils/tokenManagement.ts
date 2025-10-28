import jwt from "jsonwebtoken";
import { JwtPayload, RefreshTokenPayload } from "./types";

function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (value === undefined || value === null) {
        throw Error(`Environment variable "${key}" is not set.`);
    }
    return value;
}

const ACCESS_TOKEN_SECRET = getEnvVariable("JWT_ACCESS_SECRET");
const REFRESH_TOKEN_SECRET = getEnvVariable("JWT_REFRESH_SECRET");
const ACCESS_TOKEN_EXPIRY = getEnvVariable("JWT_ACCESS_EXPIRATION") as any;
const REFRESH_TOKEN_EXPIRY = getEnvVariable("JWT_REFRESH_EXPIRATION") as any;

function generateAccessToken(payload: JwtPayload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
}

function generateRefreshToken(payload: RefreshTokenPayload) {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
}

function verifyAccessToken(token: string) {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
}

function verifyRefreshToken(token: string) {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
}

export {
    generateAccessToken,
    generateRefreshToken,
    getEnvVariable,
    verifyAccessToken,
    verifyRefreshToken,
};
