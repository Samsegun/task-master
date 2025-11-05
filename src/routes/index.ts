import { Router } from "express";
import authRouter from "./authRoutes";
import v1Router from "./v1Routes";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/v1", v1Router);

appRouter.get("/", (req, res) => {
    res.send("welcome to task-master API");
});

export default appRouter;
