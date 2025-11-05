import { Router } from "express";
import AuthMiddleware from "../../middleware/AuthMiddleware";
import projectRouter from "./projectRoutes";
import userRouter from "./userRoutes";

const v1Router = Router();

v1Router.use(AuthMiddleware.authenticateUser);

v1Router.use("/projects", projectRouter);
v1Router.use("/users", userRouter);
// v1Router.use("/tasks", taskRouter);

export default v1Router;
