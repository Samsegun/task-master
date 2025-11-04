import AuthService from "../../services/auth.service";
import EmailService from "../../services/email.service";
import { comparePassword, hashPassword } from "../../utils/passwordUtils";
import { prisma } from "../setup";

// mock external services
jest.mock("../../services/email.service");

describe("AuthService", () => {
    const validUserData = {
        email: "test@example.com",
        password: "Password123!",
    };

    const createTestUser = async () => {
        return await AuthService.createUser(
            validUserData.email,
            validUserData.password
        );
    };
    const userInDB = async () => {
        return await prisma.user.findUnique({
            where: { email: validUserData.email },
            select: { password: true },
        });
    };

    describe("createUser", () => {
        it("should create a new user successfully", async () => {
            // user should be created with id and verification status should be false
            const result = await createTestUser();

            expect(result).toHaveProperty("id");
            expect(result.email).toBe(validUserData.email);
            expect(result.isVerified).toBe(false);

            // user should be in database
            const user = userInDB();

            expect(user).toBeDefined();
        });

        it("should throw error if email already exists", async () => {
            await createTestUser();

            await expect(createTestUser()).rejects.toThrow(/user.*exists/i);
        });

        it("should hash user password", async () => {
            await createTestUser();

            const user = await userInDB();

            const isPasswordHashed = await comparePassword(
                validUserData.password,
                user!.password
            );

            expect(isPasswordHashed).toBe(true);
        });

        it("should call email service to send verification email", async () => {
            await createTestUser();

            expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(
                validUserData.email,
                expect.any(String)
            );
        });
    });

    describe("loginUser", () => {
        beforeEach(async () => {
            // create a verified user
            const hashedPassword = await hashPassword(validUserData.password);
            await prisma.user.create({
                data: {
                    email: validUserData.email,
                    password: hashedPassword,
                    isVerified: true,
                },
            });
        });

        it("should login successfully with correct credentials", async () => {
            const result = await AuthService.loginUser(
                validUserData.email,
                validUserData.password
            );

            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(result).toHaveProperty("user");
        });

        it("should throw error if user does not exist", async () => {
            await expect(
                AuthService.loginUser("nonuser@example.com", "password123")
            ).rejects.toThrow(/invalid/i);
        });

        it("should throw error if user is not verified", async () => {
            // create unverified user
            const hashedPassword = await hashPassword(validUserData.password);
            await prisma.user.create({
                data: {
                    email: "unverified@example.com",
                    password: hashedPassword,
                    isVerified: false,
                },
            });

            await expect(
                AuthService.loginUser(
                    "unverified@example.com",
                    validUserData.password
                )
            ).rejects.toThrow(/verify email/i);
        });
    });

    describe("verifyUserMail", () => {
        let verificationToken: string;
        let userId: string;

        beforeEach(async () => {
            // create user with verification token
            verificationToken = "test-verification-token";
            const hashedPassword = await hashPassword(validUserData.password);

            const user = await prisma.user.create({
                data: {
                    email: validUserData.email,
                    password: hashedPassword,
                    verificationToken,
                    verificationTokenExpiry: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                    ),
                },
            });
            userId = user.id;
        });

        it("should verify email with valid token", async () => {
            const result = await AuthService.verifyUserMail(verificationToken);

            expect(result.user.isVerified).toBe(true);
            expect(result.user.verificationToken).toBeNull();

            // verify on database
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            expect(user?.isVerified).toBe(true);
            expect(user?.verificationToken).toBeNull();
        });

        it("should throw error if token is invalid", async () => {
            await expect(
                AuthService.verifyUserMail("invalid-token")
            ).rejects.toThrow(/invalid or expired/i);
        });

        it("should throw error if token is expired", async () => {
            // update token to have expired 1hour ago
            await prisma.user.update({
                where: { id: userId },
                data: {
                    verificationTokenExpiry: new Date(Date.now() - 3600000),
                },
            });

            await expect(
                AuthService.verifyUserMail(verificationToken)
            ).rejects.toThrow(/invalid or expired/i);
        });
    });

    describe("forgotPassword", () => {
        beforeEach(async () => {
            const hashedPassword = await hashPassword(validUserData.password);
            await prisma.user.create({
                data: {
                    email: validUserData.email,
                    password: hashedPassword,
                    isVerified: true,
                },
            });
        });

        it("should generate and save reset token", async () => {
            await AuthService.forgotPassword(validUserData.email);

            const user = await prisma.user.findUnique({
                where: { email: validUserData.email },
            });

            expect(user?.passwordResetToken).toBeDefined();
            expect(user?.passwordResetExpiry).toBeDefined();
            expect(user?.passwordResetExpiry!.getTime()).toBeGreaterThan(
                Date.now()
            );
        });

        it("should send password reset email", async () => {
            await AuthService.forgotPassword(validUserData.email);

            expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
                validUserData.email,
                expect.any(String)
            );
        });
    });

    describe("resetPassword", () => {
        let resetToken: string;
        let userId: string;

        beforeEach(async () => {
            resetToken = "test-reset-token";
            const hashedPassword = await hashPassword(validUserData.password);

            const user = await prisma.user.create({
                data: {
                    email: validUserData.email,
                    password: hashedPassword,
                    isVerified: true,
                    passwordResetToken: resetToken,
                    passwordResetExpiry: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                    ),
                },
            });
            userId = user.id;
        });

        it("should reset password with valid token", async () => {
            const newPassword = "NewPassword123!";

            await AuthService.resetPassword(resetToken, newPassword);

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            const isNewPassword = await comparePassword(
                newPassword,
                user!.password
            );
            expect(isNewPassword).toBe(true);

            expect(user?.passwordResetToken).toBeNull();
            expect(user?.passwordResetExpiry).toBeNull();
        });

        it("should throw error if token is invalid", async () => {
            await expect(
                AuthService.resetPassword("invalid-token", "NewPassword123!")
            ).rejects.toThrow(/invalid or expired/i);
        });

        it("should hash the new password", async () => {
            const newPassword = "NewPassword123!";
            await AuthService.resetPassword(resetToken, newPassword);

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            // password should not be plain text
            expect(user?.password).not.toBe(newPassword);

            const isMatch = await comparePassword(newPassword, user!.password);
            expect(isMatch).toBe(true);
        });
    });
});
