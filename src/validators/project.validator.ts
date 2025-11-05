import { z } from "zod";

const ProjectStatus = z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]);
const MemberRole = z.enum(["OWNER", "MEMBER"]);

const create = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
});

const update = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    status: ProjectStatus.optional(),
});

const addMember = z.object({
    email: z.email("Invalid email format"),
    role: MemberRole.default("MEMBER"),
});

const updateMemberRole = z.object({
    role: MemberRole,
});

export type ProjectStatus = z.infer<typeof ProjectStatus>;
export type MemberRole = z.infer<typeof MemberRole>;
export type CreateProject = z.infer<typeof create>;
export type UpdateProject = z.infer<typeof update>;
export type AddProjectMember = z.infer<typeof addMember>;

export default {
    create,
    update,
    addMember,
    updateMemberRole,
};
