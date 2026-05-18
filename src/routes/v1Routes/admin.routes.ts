import { Router } from "express";
import UserController from "../../controllers/user.controller";
import AdminMiddleware from "../../middleware/AdminMiddleware";
import ValidationMiddleware from "../../middleware/ValidationMiddleware";
import userValidator from "../../validators/user.validator";

const adminRouter = Router();

const { validateBodyData } = ValidationMiddleware;
const { updateUserRole, updateUserSuspension } = userValidator;
const { authorizeNonUser } = AdminMiddleware;
const {
    getAllUsers,
    getUserById,
    updateUserRole: userRoleController,
    updateUserSuspension: userSuspensionController,
} = UserController;

adminRouter.use(authorizeNonUser);

adminRouter.get("/users", getAllUsers);
adminRouter.get("/users/:userId", getUserById);

adminRouter.patch(
    "/users/:userId/role",
    validateBodyData(updateUserRole),
    userRoleController,
);

adminRouter.patch(
    "/users/:userId/suspension",
    validateBodyData(updateUserSuspension),
    userSuspensionController,
);

export default adminRouter;
