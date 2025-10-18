import { Router } from "express";
import authRouter from "./authRoutes";
import protectedRouter from "./protectedRoutes";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use(
    "/protected",
    (req, res, next) => {
        console.log("protected route");
        next();
    },

    protectedRouter
);

appRouter.use("/", (req, res) => {
    res.send("welcome to task-master api");
});

export default appRouter;
