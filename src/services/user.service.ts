import { EntityNotFound, UnauthorizedError, ValidationError } from "../errors";
import { comparePassword, hashPassword } from "../utils/passwordUtils";
import prisma from "../utils/prisma";

class UserService {
    // also serves as userProfile
    // not sure if separating AuthStatus or userProfile is logical
    static async getAuthStatus(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isVerified: true,
                firstName: true,
                lastName: true,
            },
        });

        if (!user) throw new EntityNotFound("User not found");

        return user;
    }

    static async updateUserProfile(
        userId: string,
        data: {
            firstName?: string;
            lastName?: string;
            username?: string;
        }
    ) {
        // check if username is already taken (if updating username)
        if (data.username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username: data.username,
                    NOT: { id: userId },
                },
            });
            if (existingUser)
                throw new ValidationError("Username is already taken");
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username,
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
            },
        });

        return updatedUser;
    }

    static async updateUserPassword(
        userId: string,
        data: {
            currentPassword: string;
            newPassword: string;
        }
    ) {
        const { currentPassword, newPassword } = data;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                password: true,
            },
        });
        if (!user) throw new EntityNotFound("User not found");

        // check current password
        const isValidPassword = await comparePassword(
            currentPassword,
            user.password
        );
        if (!isValidPassword)
            throw new UnauthorizedError("Current password is incorrect");

        // no reuse of the same password
        const isSamePassword = await comparePassword(
            newPassword,
            user.password
        );
        if (isSamePassword)
            throw new ValidationError(
                "New password cannot be the same as the current password"
            );

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: "Password updated successfully" };
    }
}

export default UserService;
