import rateLimit from "express-rate-limit";

// ─── Login limiter ──────────────────────────────────
// Strict — prevents brute-force password guessing
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // 5 attempts per window
    message: {
        success: false,
        message: "Too many login attempts. Please try again in 15 minutes.",
    },
    standardHeaders: true, // sends RateLimit-* headers
    legacyHeaders: false, // disables deprecated X-RateLimit-* headers
    skipSuccessfulRequests: true, // only counts FAILED login attempts
});

// ─── Register limiter ──────────────────────────────
// Looser — prevents mass account creation/spam
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // 10 accounts per IP per hour
    message: {
        success: false,
        message:
            "Too many accounts created from this IP. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Password reset limiter ────────────────────────
// Strict — prevents email-bombing a user with reset requests
export const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 3, // 3 requests per window
    message: {
        success: false,
        message:
            "Too many password reset requests. Please try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
