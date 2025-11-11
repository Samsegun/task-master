import { Router } from "express";

const userRouter = Router();

userRouter.get("/", (req, res) => {
    const userId = (req as any).userId;

    res.send(`hello from user ${userId}`);
});

export default userRouter;
