import { Router } from "express";
import {
    UserLoginSchema,
    UserRegistrationSchema,
    validateData,
} from "../validators/auth.validator";

type validatedRequest = {
    email: string;
    password: string;
};

const authRouter = Router();

authRouter.post(
    "/register",
    validateData(UserRegistrationSchema),
    (req, res) => {
        const { email, password } = req.body as validatedRequest;

        console.log(email, password);

        res.send("hello from register");
    }
);

authRouter.post("/login", validateData(UserLoginSchema), (req, res) => {
    const { email, password } = req.body as validatedRequest;

    console.log(email, password);

    res.send("hello from login");
});

export default authRouter;
