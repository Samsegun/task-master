import { CookieOptions } from "express";
import ms from "ms";
import {
    ACCESS_TOKEN_EXPIRY,
    getEnvVariable,
    REFRESH_TOKEN_EXPIRY,
} from "../utils/tokenManagement";

const REFRESH_PASSWORD_EXPIRATION_TIME = getEnvVariable(
    "REFRESH_PASSWORD_EXPIRATION"
);

const ACCESS_TOKEN_EXPIRY_TIME = parseInt(ms(ACCESS_TOKEN_EXPIRY));
const REFRESH_TOKEN_EXPIRY_TIME = parseInt(ms(REFRESH_TOKEN_EXPIRY));
const REFRESH_PASSWORD_TOKEN_EXPIRY = parseInt(
    REFRESH_PASSWORD_EXPIRATION_TIME
);
const MAX_AGE = REFRESH_TOKEN_EXPIRY_TIME;

export const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // sameSite: "strict",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
};

/**
 * Here, the accessToken cookie maxAge is same as the refreshToken.
 * If accessToken cookie maxAge is short-lived(e.g 5mins),
 * the browser deletes the cookie once it expires and will not be sent to the server.
 *  This prevents the auth-middleware from handling valid or invalid tokens.
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
    refreshPasswordTokenTime: REFRESH_PASSWORD_TOKEN_EXPIRY,
};
