import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthMiddleware from "../middleware/AuthMiddleware";
import AuthValidator from "../validators/auth.validator";
import { validateData } from "../validators/validateData";

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

authRouter.post("/register", validateData(create), createUser);

authRouter.post("/login", validateData(login), loginUser);

authRouter.post("/logout", logoutUser);

authRouter.post(
    "/refresh-token",
    AuthMiddleware.refreshTokenValidation,
    refreshAccessToken
);

authRouter.get("/verify-email", verifyUserMail);

authRouter.post(
    "/forgot-password",
    validateData(validateForgotPassword),
    forgotPassword
);

authRouter.post(
    "/reset-password",
    validateData(validateResetPassword),
    resetPassword
);

export default authRouter;
