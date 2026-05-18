import { Role } from "@prisma/client";
import z from "zod";

const RoleEnum = z.enum(Role);

const updateProfile = z
    .object({
        firstName: z.string().max(30).optional(),
        lastName: z.string().max(30).optional(),
        username: z
            .string()
            .min(3)
            .max(30)
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username must consist of alphanumeric characters and underscores",
            )
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

const updatePassword = z.object({
    currentPassword: z.string().nonempty("Current password is required"),
    newPassword: z
        .string()
        .trim()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[@$!%*?&]/,
            "Password must contain at least one special character",
        ),
});

const updateUserRole = z.object({
    role: RoleEnum,
});

const updateUserSuspension = z.object({
    isSuspended: z.boolean(),
});

export type UpdateProfile = z.infer<typeof updateProfile>;
export type UpdatePassword = z.infer<typeof updatePassword>;

export default {
    updateProfile,
    updatePassword,
    updateUserRole,
    updateUserSuspension,
};
