import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthMiddleware from "../middleware/AuthMiddleware";
import AuthValidator from "../validators/auth.validator";
import { validateData } from "../validators/validateData";

const authRouter = Router();

const { create, login, forgotPassword, resetPassword } = AuthValidator;

authRouter.post("/register", validateData(create), AuthController.createUser);

authRouter.post("/login", validateData(login), AuthController.loginUser);

authRouter.post("/logout", AuthController.logoutUser);

authRouter.post(
    "/refresh-token",
    AuthMiddleware.refreshTokenValidation,
    AuthController.refreshAccessToken
);

authRouter.get("/verify-email", AuthController.verifyUserMail);

authRouter.post(
    "/forgot-password",
    validateData(forgotPassword),
    AuthController.forgotPassword
);

authRouter.post(
    "/reset-password",
    validateData(resetPassword),
    AuthController.resetPassword
);

export default authRouter;
