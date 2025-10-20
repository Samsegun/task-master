import { Request, Response } from "express";
import asyncHandler from "../utils/asyncRequestHandler";
import { ValidatedAuthRequest } from "../utils/types";

class AuthController {
    static createUser = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body as ValidatedAuthRequest;

        console.log(email, password);

        res.send("hello from register");
    });

    static loginUser = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body as ValidatedAuthRequest;

        console.log(email, password);

        res.send("hello from login");
    });
}

export default AuthController;
