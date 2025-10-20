import { Router } from "express";
import AuthController from "../controllers/auth.controller";
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

export default authRouter;
