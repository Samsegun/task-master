import { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";

export const UserRegistrationSchema = z.object({
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

export const UserLoginSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().trim(),
});

export const ForgotPasswordSchema = UserRegistrationSchema.omit({
    password: true,
});

export const ResetPasswordSchema = z.object({
    token: z.string().trim(),
    password: UserRegistrationSchema.shape.password,
});

export function validateData(schema: z.ZodObject<any, any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((issue: any) => ({
                    message: `${issue.message}`,
                }));

                res.status(400).json({
                    error: "Input Validation failed.",
                    details: errorMessages,
                });
            } else {
                res.status(500).json({
                    error: "Internal Server Error",
                });
            }
        }
    };
}
