import { Router } from "express";
import authRouter from "./auth.routes";
import v1Router from "./v1Routes";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/v1", v1Router);

appRouter.get("/", (_req, res) => {
    res.send("welcome to task-master API");
});

appRouter.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default appRouter;
