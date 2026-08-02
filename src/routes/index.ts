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

// temporary test route — remove after confirming Sentry works
appRouter.get("/debug-sentry", () => {
    throw new Error("Sentry test error from Taskmaster 🚀");
});

export default appRouter;
