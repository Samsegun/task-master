import { CookieOptions } from "express";

// ADJUST SUBSTRING POSITIONING WHEN EXPIRATION VALUES CHANGE!!!
const ACCESS_TOEKN_EXPIRY = parseInt(
    process.env.JWT_ACCESS_EXPIRATION!.substring(-1, 2)
);
const REFRESH_TOKEN_EXPIRY = parseInt(
    process.env.JWT_REFRESH_EXPIRATION!.substring(-1, 1)
);
const REFRESH_PASSWORD_TOKEN_EXPIRY = parseInt(
    process.env.REFRESH_PASSWORD_EXPIRATION!
);
const MAX_AGE = REFRESH_TOKEN_EXPIRY * 24 * 60 * 60 * 1000;

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
 * refreshToken cookie is scoped to /api/auth.
 * This reduces exposure by keeping it off non-auth API calls.
 */
export const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    path: "/api/auth",
    maxAge: MAX_AGE,
};

export const authConfig = {
    accessTokenExpiryTime: ACCESS_TOEKN_EXPIRY,
    refreshTokenExpiryTime: REFRESH_TOKEN_EXPIRY,
    refreshPasswordTokenTime: REFRESH_PASSWORD_TOKEN_EXPIRY,
};
