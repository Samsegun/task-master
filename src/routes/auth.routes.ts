import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthMiddleware from "../middleware/AuthMiddleware";
import AuthValidator from "../validators/auth.validator";
import { validateData } from "../validators/validateData";

const authRouter = Router();

authRouter.post(
    "/register",
    validateData(AuthValidator.create),
    AuthController.createUser
);

authRouter.post(
    "/login",
    validateData(AuthValidator.login),
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
    validateData(AuthValidator.forgotPassword),
    AuthController.forgotPassword
);

authRouter.post(
    "/reset-password",
    validateData(AuthValidator.resetPassword),
    AuthController.resetPassword
);

export default authRouter;
