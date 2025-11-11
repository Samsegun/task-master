import { Router } from "express";
import AuthMiddleware from "../../middleware/AuthMiddleware";
import projectRouter from "./project.routes";
import userRouter from "./user.routes";

const v1Router = Router();

v1Router.use(AuthMiddleware.authenticateUser);

v1Router.use("/projects", projectRouter);
v1Router.use("/users", userRouter);

export default v1Router;
