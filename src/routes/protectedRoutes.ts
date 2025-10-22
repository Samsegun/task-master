import { Router } from "express";

const protectedRouter = Router();

protectedRouter.get("/profile", (req, res) => {
    console.log(req.body);

    res.send("hello from profile");
});

protectedRouter.get("/user", (req, res) => {
    const userId = (req as any).userId;

    console.log(userId);

    res.send("hello from user");
});

export default protectedRouter;
