// import { v4 as uuidv4 } from "uuid";
import { randomUUID } from "node:crypto";
import { authConfig } from "../config/auth.config";
import { ForbiddenError, ValidationError } from "../errors";
import { comparePassword, hashPassword } from "../utils/passwordUtils";
import prisma from "../utils/prisma";
import EmailService from "./email.service";
import TokenService from "./token.service";

class AuthService {
    static createUser = async (email: string, password: string) => {
        const userExists = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (userExists) {
            throw new ValidationError("User already exists");
        }

        // hashpassword
        const hashedPassword = await hashPassword(password);
        if (!hashedPassword) throw Error("Server error");

        // generate verification token
        const verificationToken = randomUUID();
        const verificationTokenExpiry = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        // create user
        const newUser = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                verificationToken,
                verificationTokenExpiry,
            },
            select: {
                id: true,
                email: true,
                isVerified: true,
            },
        });
        if (!newUser) throw Error("Failed to create user. An error occurred");

        await EmailService.sendVerificationEmail(email, verificationToken);

        return newUser;
    };

    static loginUser = async (email: string, password: string) => {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                isVerified: true,
                role: true,
                username: true,
            },
        });
        if (!user) throw new ValidationError("Invalid credentials");

        // compare passwords
        const passwordIsEqual = await comparePassword(password, user.password!);
        if (!passwordIsEqual) throw new ValidationError("Invalid credentials");

        // check if email is verified
        if (!user.isVerified)
            throw new ValidationError("please verify email before signing in");

        const authTokensArgs = {
            userId: user.id,
            role: user.role,
            isVerified: user.isVerified,
        };

        const { accessToken, refreshToken } =
            await TokenService.createAuthTokens(
                authTokensArgs.userId,
                authTokensArgs.role,
                authTokensArgs.isVerified
            );

        const safeUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            // firstName: user.firstName,
            // lastName: user.lastName,
            isVerified: user.isVerified,
        };

        return { accessToken, refreshToken, user: safeUser };
    };

    static refreshToken = async (userInfo: any) => {
        const { tokenId, userId } = userInfo as {
            userId: string;
            tokenId: string;
        };

        // find refresh token in database
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                id: tokenId,
                userId: userId,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        role: true,
                        isVerified: true,
                    },
                },
            },
        });
        if (!storedToken)
            throw new ForbiddenError("You can not perform this operation");

        // delete old refresh token (rotation)
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        // generate new access and refresh tokens
        const {
            user: { id, isVerified, role },
        } = storedToken;
        const { accessToken, refreshToken } =
            await TokenService.createAuthTokens(id, role, isVerified);

        return { accessToken, refreshToken };
    };

    static verifyUserMail = async (token: string) => {
        // find user with the verification token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: { gt: new Date() },
                isVerified: false,
            },
        });
        if (!user)
            throw new ValidationError("Invalid or expired verification token");

        // update isVerified field to true
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });
        if (!updatedUser)
            throw Error("Failed to update user. An error occurred");

        const authTokensArgs = {
            userId: user.id,
            role: user.role,
            isVerified: user.isVerified,
        };

        const { accessToken, refreshToken } =
            await TokenService.createAuthTokens(
                authTokensArgs.userId,
                authTokensArgs.role,
                authTokensArgs.isVerified
            );

        const userDetails = {
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified,
            verificationToken: updatedUser.verificationToken,
        };

        return { accessToken, refreshToken, user: userDetails };
    };

    static forgotPassword = async (email: string) => {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, isVerified: true },
        });
        if (!user || !user.isVerified) return { success: false };

        const resetPasswordToken = randomUUID();
        const resetPasswordTokenExpiry = new Date(
            Date.now() + authConfig.refreshPasswordTokenTime * 60 * 1000
        );

        // update user with reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetPasswordToken,
                passwordResetExpiry: resetPasswordTokenExpiry,
            },
        });

        await EmailService.sendPasswordResetEmail(email, resetPasswordToken);

        return { success: true };
    };

    static resetPassword = async (token: string, password: string) => {
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpiry: { gt: new Date() },
                isVerified: true,
            },
        });
        if (!user) throw new ValidationError("Invalid or expired reset token");

        // hashpassword
        const hashedPassword = await hashPassword(password);
        if (!hashedPassword) throw Error("Server error");

        // update password, clear resetToken and resetExpiry values
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        });

        // invalidate all existing refresh tokens for security
        await prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });

        return { success: true };
    };
}

export default AuthService;
