import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { ValidationError } from "../errors";
import {
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

authRouter.get("/verify-email", AuthController.verifyUserMail);

authRouter.get("/reset-password", (req, res) => {
    const { token, email } = req.query;

    if (!token || typeof token !== "string") {
        throw new ValidationError("Invalid token");
    }

    res.send(token + email + " reset password");
});

export default authRouter;
