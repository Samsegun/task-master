import { CookieOptions } from "express";
import ms from "ms";
import {
    ACCESS_TOKEN_EXPIRY,
    getEnvVariable,
    REFRESH_TOKEN_EXPIRY,
} from "../utils/tokenManagement";

const REFRESH_PASSWORD_EXPIRATION_TIME: any = getEnvVariable(
    "REFRESH_PASSWORD_EXPIRATION",
);

const ACCESS_TOKEN_EXPIRY_TIME = parseInt(ms(ACCESS_TOKEN_EXPIRY));
const REFRESH_TOKEN_EXPIRY_TIME = parseInt(ms(REFRESH_TOKEN_EXPIRY));
const REFRESH_PASSWORD_EXPIRY = parseInt(ms(REFRESH_PASSWORD_EXPIRATION_TIME));
const MAX_AGE = REFRESH_TOKEN_EXPIRY_TIME;

export const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // sameSite: "strict",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
};

/**
 * The accessToken cookie maxAge is intentionally set to match the refreshToken's.
 * The cookie is just a transport vehicle — the JWT's own expiry (`exp` claim) is
 * what auth middleware validates. Setting a short cookie maxAge would cause the
 * browser to drop the cookie before the refresh flow gets a chance to replace it,
 * breaking silent token rotation for still-active sessions.
 */
export const accessTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: MAX_AGE,
};

/**
 * refreshToken cookie is scoped to /api/auth
 * reduces exposure by keeping it off non-auth API calls.
 */
export const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    path: "/api/auth",
    maxAge: MAX_AGE,
};

export const authConfig = {
    accessTokenExpiryTime: ACCESS_TOKEN_EXPIRY_TIME,
    refreshTokenExpiryTime: REFRESH_TOKEN_EXPIRY_TIME,
    refreshPasswordTokenTime: REFRESH_PASSWORD_EXPIRY,
};
