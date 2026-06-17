import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthMiddleware from "../middleware/AuthMiddleware";

import {
    loginLimiter,
    passwordResetLimiter,
    registerLimiter,
} from "../middleware/RateLimiter";
import ValidationMiddleware from "../middleware/ValidationMiddleware";
import AuthValidator from "../validators/auth.validator";

const authRouter = Router();

const { create, login, validateForgotPassword, validateResetPassword } =
    AuthValidator;
const {
    createUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyUserMail,
    forgotPassword,
    resetPassword,
} = AuthController;
const { validateBodyData } = ValidationMiddleware;

authRouter.post(
    "/register",
    validateBodyData(create),
    registerLimiter,
    createUser,
);

authRouter.post("/login", validateBodyData(login), loginLimiter, loginUser);

authRouter.post("/logout", logoutUser);

authRouter.post(
    "/refresh-token",
    AuthMiddleware.refreshTokenValidation,
    refreshAccessToken,
);

authRouter.get("/verify-email", verifyUserMail);

authRouter.post(
    "/forgot-password",
    validateBodyData(validateForgotPassword),
    forgotPassword,
);

authRouter.post(
    "/reset-password",
    validateBodyData(validateResetPassword),
    passwordResetLimiter,
    resetPassword,
);

export default authRouter;
