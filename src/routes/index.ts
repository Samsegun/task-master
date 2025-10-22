import { Router } from "express";
import AuthMiddleware from "../middleware/AuthMiddleware";
import authRouter from "./authRoutes";
import protectedRouter from "./protectedRoutes";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/protected", AuthMiddleware.authenticateUser, protectedRouter);

appRouter.use("/", (req, res) => {
    res.send("welcome to task-master api");
});

export default appRouter;
