import { Router } from "express";
import AuthMiddleware from "../../middleware/AuthMiddleware";
import projectRouter from "./project.routes";
import userRouter from "./user.routes";

const v1Router = Router();

const { authenticateUser } = AuthMiddleware;

v1Router.use(authenticateUser);

v1Router.use("/projects", projectRouter);
v1Router.use("/users/me", userRouter);

export default v1Router;
