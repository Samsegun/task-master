import { NextFunction, Request, Response } from "express";
import { EntityNotFound, ForbiddenError } from "../errors";
import UserService from "../services/user.service";

class AdminMiddleware {
    static authorizeNonUser = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const requesterId = (req as any).userId;

        const user = await UserService.getAuthStatus(requesterId);

        if (!user) throw new EntityNotFound("No user found");

        const allowedRoles = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];

        if (!allowedRoles.includes(user.role))
            throw new ForbiddenError("Access denied: elevated role required");

        (req as any).superUserInfo = user;
        next();
    };
}

export default AdminMiddleware;
