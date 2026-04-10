import { z } from "zod";

const create = z.object({
    email: z.email("Invalid email format"),
    password: z
        .string()
        .trim()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[@$!%*?&]/,
            "Password must contain at least one special character"
        ),
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username may contain letters, numbers and underscores only"
        ),
});

// user should be able to login wih either email or username
const login = z.object({
    emailOrusername: z
        .string()
        .trim()
        .refine(
            value => {
                const isEmail = z.email().safeParse(value).success;
                const isUsername = /^[a-zA-Z0-9_]+$/.test(value);

                return isEmail || isUsername;
            },
            {
                message: "Enter a valid email or username",
            }
        ),
    password: z.string().trim(),
});

const validateForgotPassword = create.omit({
    password: true,
    username: true,
});

const validateResetPassword = z.object({
    token: z.string().trim(),
    password: create.shape.password,
});

export default {
    create,
    login,
    validateForgotPassword,
    validateResetPassword,
};
