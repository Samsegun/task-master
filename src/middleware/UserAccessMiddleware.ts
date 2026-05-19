import { NextFunction, Request, Response } from "express";
import { EntityNotFound, UnauthorizedError } from "../errors";
import prisma from "../utils/prisma";

class UserAccessMiddleware {
    static checkUserAccess = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const userId = (req as any).userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isSuspended: true },
        });

        if (!user) throw new EntityNotFound("User not found");
        if (user.isSuspended)
            throw new UnauthorizedError(
                "Account suspended",
                "ACCOUNT_SUSPENDED",
            );

        next();
    };
}

export default UserAccessMiddleware;
