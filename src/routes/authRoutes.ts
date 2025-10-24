import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthMiddleware from "../middleware/AuthMiddleware";
import {
    ForgotPasswordSchema,
    ResetPasswordSchema,
    UserLoginSchema,
    UserRegistrationSchema,
    validateData,
} from "../validators/auth.validator";

const authRouter = Router();

authRouter.post(
    "/register",
    validateData(UserRegistrationSchema),
    AuthController.createUser
);

authRouter.post(
    "/login",
    validateData(UserLoginSchema),
    AuthController.loginUser
);

authRouter.post("/logout", AuthController.logoutUser);

authRouter.post(
    "/refresh-token",
    AuthMiddleware.refreshTokenValidation,
    AuthController.refreshAccessToken
);

authRouter.get("/verify-email", AuthController.verifyUserMail);

authRouter.post(
    "/forgot-password",
    validateData(ForgotPasswordSchema),
    AuthController.forgotPassword
);

authRouter.post(
    "/reset-password",
    validateData(ResetPasswordSchema),
    AuthController.resetPassword
);

export default authRouter;
