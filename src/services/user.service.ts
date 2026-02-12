import { EntityNotFound } from "../errors";
import prisma from "../utils/prisma";

class UserService {
    static async getAuthStatus(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isVerified: true,
            },
        });

        if (!user) {
            throw new EntityNotFound("User not found");
        }

        return user;
    }
}

export default UserService;
