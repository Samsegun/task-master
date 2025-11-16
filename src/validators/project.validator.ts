import { ProjectRole, ProjectStatus } from "@prisma/client";
import { z } from "zod";

const ProjectStatusEnum = z.enum(ProjectStatus);
const MemberRoleEnum = z.enum(ProjectRole);

const create = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
});

const update = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    status: ProjectStatusEnum.optional(),
});

const addMember = z.object({
    email: z.email("Invalid email format"),
    role: MemberRoleEnum.default("MEMBER"),
});

const updateMemberRole = z.object({
    role: MemberRoleEnum,
});

export type CreateProject = z.infer<typeof create>;
export type UpdateProject = z.infer<typeof update>;
export type AddProjectMember = z.infer<typeof addMember>;

export default {
    create,
    update,
    addMember,
    updateMemberRole,
};
