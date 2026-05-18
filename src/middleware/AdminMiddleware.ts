import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors";
import prisma from "../utils/prisma";

class AdminMiddleware {
    static authorizeNonUser = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const requesterId = (req as any).userId;

        const user = await prisma.user.findUnique({
            where: { id: requesterId },
            select: { role: true, id: true },
        });

        if (!user) throw new UnauthorizedError("No user found");

        const allowedRoles = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];

        if (!allowedRoles.includes(user.role)) {
            throw new UnauthorizedError(
                "Access denied: elevated role required",
            );
        }

        (req as any).superUserInfo = user;
        next();
    };
}

export default AdminMiddleware;
