import { Router } from "express";
import AuthMiddleware from "../../middleware/AuthMiddleware";
import UserAccessMiddleware from "../../middleware/UserAccessMiddleware";
import adminRouter from "./admin.routes";
import projectRouter from "./project.routes";
import userRouter from "./user.routes";

const v1Router = Router();

const { authenticateUser } = AuthMiddleware;
const { checkUserAccess } = UserAccessMiddleware;

v1Router.use(authenticateUser);
v1Router.use(checkUserAccess);

v1Router.use("/projects", projectRouter);
v1Router.use("/users/me", userRouter);
v1Router.use("/admin", adminRouter);

export default v1Router;
