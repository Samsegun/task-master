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
});

const login = z.object({
    email: z.email("Invalid email format"),
    password: z.string().trim(),
});

const validateForgotPassword = create.omit({
    password: true,
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
