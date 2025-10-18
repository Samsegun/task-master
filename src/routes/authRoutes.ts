import { Router } from "express";
import {
    UserLoginSchema,
    UserRegistrationSchema,
    validateData,
} from "../validators/auth.validator";

const authRouter = Router();

authRouter.get(
    "/register",
    validateData(UserRegistrationSchema),
    (req, res) => {
        console.log(req.body);

        res.send("hello from register");
    }
);

authRouter.get("/login", validateData(UserLoginSchema), (req, res) => {
    console.log(req.body);

    res.send("hello from login");
});

export default authRouter;
