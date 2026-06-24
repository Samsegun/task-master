import request from "supertest";
import app from "../../app";
import EmailService from "../../services/email.service";
import { hashPassword } from "../../utils/passwordUtils";
import { prisma } from "../setup";

jest.mock("../../services/email.service");

describe("Auth route rate limiting", () => {
    const validPassword = "Password123!";

    const postFromIp = (path: string, ip: string) => {
        return request(app).post(path).set("X-Forwarded-For", ip);
    };

    beforeEach(() => {
        jest.mocked(EmailService.sendVerificationEmail).mockResolvedValue(
            undefined,
        );
        jest.mocked(EmailService.sendPasswordResetEmail).mockResolvedValue(
            undefined,
        );
    });

    it("rate limits /register after 10 requests from the same IP", async () => {
        const ip = "203.0.113.10";

        for (let requestNumber = 1; requestNumber <= 10; requestNumber += 1) {
            const response = await postFromIp("/api/auth/register", ip).send({
                email: `rate-register-${requestNumber}@example.com`,
                password: validPassword,
            });

            expect(response.status).toBe(201);
            expect(response.headers["ratelimit-limit"]).toBe("10");
        }

        const limitedResponse = await postFromIp("/api/auth/register", ip).send(
            {
                email: "rate-register-limited@example.com",
                password: validPassword,
            },
        );

        expect(limitedResponse.status).toBe(429);
        expect(limitedResponse.body).toEqual({
            success: false,
            message:
                "Too many accounts created from this IP. Please try again later.",
        });
    });

    it("rate limits /login after 5 failed requests from the same IP", async () => {
        const ip = "203.0.113.11";
        const email = "rate-login@example.com";
        const password = "Correct123!";

        await prisma.user.create({
            data: {
                email,
                password: await hashPassword(password),
                username: "rate-login-user",
                isVerified: true,
            },
        });

        for (let requestNumber = 1; requestNumber <= 5; requestNumber += 1) {
            const response = await postFromIp("/api/auth/login", ip).send({
                emailOrusername: email,
                password: "Wrong123!",
            });

            expect(response.status).toBe(400);
            expect(response.headers["ratelimit-limit"]).toBe("5");
        }

        const limitedResponse = await postFromIp("/api/auth/login", ip).send({
            emailOrusername: email,
            password: "Wrong123!",
        });

        expect(limitedResponse.status).toBe(429);
        expect(limitedResponse.body).toEqual({
            success: false,
            message: "Too many login attempts. Please try again in 15 minutes.",
        });
    });

    it("does not count successful /login requests toward the failed-login limit", async () => {
        const ip = "203.0.113.12";
        const email = "rate-login-success@example.com";
        const password = "Correct123!";

        await prisma.user.create({
            data: {
                email,
                password: await hashPassword(password),
                username: "rate-login-success-user",
                isVerified: true,
            },
        });

        for (let requestNumber = 1; requestNumber <= 6; requestNumber += 1) {
            const response = await postFromIp("/api/auth/login", ip).send({
                emailOrusername: email,
                password,
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        }
    });

    it("rate limits /reset-password after 3 requests from the same IP", async () => {
        const ip = "203.0.113.13";

        for (let requestNumber = 1; requestNumber <= 3; requestNumber += 1) {
            const response = await postFromIp(
                "/api/auth/reset-password",
                ip,
            ).send({
                token: `missing-token-${requestNumber}`,
                password: validPassword,
            });

            expect(response.status).toBe(400);
            expect(response.headers["ratelimit-limit"]).toBe("3");
        }

        const limitedResponse = await postFromIp(
            "/api/auth/reset-password",
            ip,
        ).send({
            token: "missing-token-limited",
            password: validPassword,
        });

        expect(limitedResponse.status).toBe(429);
        expect(limitedResponse.body).toEqual({
            success: false,
            message:
                "Too many password reset requests. Please try again in 15 minutes.",
        });
    });
});
