import AuthService from "../../services/auth.service";
import EmailService from "../../services/email.service";
import { comparePassword } from "../../utils/passwordUtils";
import { prisma } from "../setup";

// mock external services
jest.mock("../../services/email.service");

describe("AuthService.createUser", () => {
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

// describe("loginUser", () => {

// })
