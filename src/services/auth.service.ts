import { v4 as uuidv4 } from "uuid";
import { ValidationError } from "../errors";
import { comparePassword, hashPassword } from "../utils/passwordUtils";
import prisma from "../utils/prisma";
import EmailService from "./email.service";
import { tokenService } from "./token.service";

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
        const verificationToken = uuidv4();
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
            await tokenService.createAuthTokens(
                authTokensArgs.userId,
                authTokensArgs.role,
                authTokensArgs.isVerified
            );

        return { accessToken, refreshToken, user };
    };

    static verifyUserMail = async (token: string) => {
        // find user with this verification token
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
            await tokenService.createAuthTokens(
                authTokensArgs.userId,
                authTokensArgs.role,
                authTokensArgs.isVerified
            );

        return { accessToken, refreshToken };
    };
}

export default AuthService;
