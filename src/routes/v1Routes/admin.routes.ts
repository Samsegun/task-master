import { Router } from "express";
import UserController from "../../controllers/user.controller";
import AuthMiddleware from "../../middleware/AuthMiddleware";

const adminRouter = Router();

const { authorizeNonUser } = AuthMiddleware;
const { getAllUsers, getUserById } = UserController;

adminRouter.use(authorizeNonUser);

adminRouter.get("/users", getAllUsers);
adminRouter.get("/users/:userId", getUserById);

export default adminRouter;
