import ProjectService from "../../services/project.service";
import TaskService from "../../services/task.service";
import { hashPassword } from "../../utils/passwordUtils";
import { prisma } from "../setup";

describe("TaskService", () => {
    let ownerId: string;
    let memberId: string;
    let projectId: string;

    beforeEach(async () => {
        const hashedPassword = await hashPassword("Password123!");

        // create project owner
        const owner = await prisma.user.create({
            data: {
                email: "owner@example.com",
                password: hashedPassword,
                isVerified: true,
            },
        });
        ownerId = owner.id;

        // create project member
        const member = await prisma.user.create({
            data: {
                email: "member@example.com",
                password: hashedPassword,
                isVerified: true,
            },
        });
        memberId = member.id;

        // create project
        const project = await ProjectService.createProject(ownerId, {
            name: "Test Project",
        });
        projectId = project.id;

        // add member to project
        await prisma.projectMember.create({
            data: {
                projectId: project.id,
                userId: memberId,
                role: "MEMBER",
            },
        });
    });

    describe("createTask", () => {
        it("should create task successfully", async () => {
            const task = await TaskService.createTask(projectId, ownerId, {
                title: "Test Task",
                priority: "HIGH",
            });

            expect(task.title).toBe("Test Task");
            expect(task.status).toBe("TODO");
            expect(task.creatorId).toBe(ownerId);
        });

        it("should throw error if creator is not the owner of project", async () => {
            const outsider = await prisma.user.create({
                data: {
                    email: "outsider@example.com",
                    password: "password",
                    isVerified: true,
                },
            });

            await expect(
                TaskService.createTask(projectId, outsider.id, {
                    title: "Unauthorized Task",
                    priority: "LOW",
                })
            ).rejects.toThrow(/not the owner/i);
        });

        it("should throw error if assignee is not a project member", async () => {
            const outsider = await prisma.user.create({
                data: {
                    email: "outsider@example.com",
                    password: "password",
                    isVerified: true,
                },
            });

            await expect(
                TaskService.createTask(projectId, ownerId, {
                    title: "Test Task",
                    assigneeId: outsider.id,
                    priority: "MEDIUM",
                })
            ).rejects.toThrow(/not a member/i);
        });
    });

    describe("updateTask", () => {
        let taskId: string;

        beforeEach(async () => {
            const task = await TaskService.createTask(projectId, ownerId, {
                title: "Original Task",
                priority: "MEDIUM",
            });
            taskId = task.id;
        });

        it("should update task successfully", async () => {
            const updated = await TaskService.updateTask(
                projectId,
                taskId,
                ownerId,
                { title: "Updated Task", status: "IN_PROGRESS" }
            );

            expect(updated.title).toBe("Updated Task");
            expect(updated.status).toBe("IN_PROGRESS");
        });

        it("should set completedAt when status is DONE", async () => {
            const updated = await TaskService.updateTask(
                projectId,
                taskId,
                ownerId,
                { status: "DONE" }
            );

            expect(updated.completedAt).toBeDefined();
        });

        it("should throw error if user is not a project member", async () => {
            const outsider = await prisma.user.create({
                data: {
                    email: "outsider@example.com",
                    password: "password",
                },
            });

            await expect(
                TaskService.updateTask(projectId, taskId, outsider.id, {
                    title: "Hacked",
                })
            ).rejects.toThrow("You are not a member of this project");
        });
    });

    describe("deleteTask", () => {
        let taskId: string;

        beforeEach(async () => {
            const task = await TaskService.createTask(projectId, ownerId, {
                title: "Task to Delete",
                priority: "HIGH",
            });
            taskId = task.id;
        });

        it("should delete task successfully", async () => {
            await TaskService.deleteTask(projectId, taskId, ownerId);

            const deleted = await prisma.task.findUnique({
                where: { id: taskId },
            });
            expect(deleted).toBeNull();
        });
    });

    describe("getMyTasks", () => {
        beforeEach(async () => {
            // create tasks assigned to member
            await TaskService.createTask(projectId, ownerId, {
                title: "Task 1",
                assigneeId: memberId,
                priority: "HIGH",
            });
            await TaskService.createTask(projectId, ownerId, {
                title: "Task 2",
                assigneeId: memberId,
                priority: "HIGH",
            });
            // unassigned task
            await TaskService.createTask(projectId, ownerId, {
                title: "Task 3",
                priority: "HIGH",
            });
        });

        it("should return only tasks assigned to user", async () => {
            const tasks = await TaskService.getMyTasks(memberId);

            expect(tasks).toHaveLength(2);
            tasks.forEach(task => {
                expect(task.assigneeId).toBe(memberId);
            });
        });
    });

    describe("getOverdueTasks", () => {
        beforeEach(async () => {
            await TaskService.createTask(projectId, ownerId, {
                title: "overdue task 1",
                priority: "HIGH",
                assigneeId: ownerId,
                dueDate: new Date("2025-10-10T10:00:00Z"),
            });

            await TaskService.createTask(projectId, ownerId, {
                title: "overdue task 2",
                priority: "HIGH",
                assigneeId: ownerId,
                dueDate: new Date("2025-10-09T10:00:00Z"),
            });
        });

        it("should return overdue tasks across all projects", async () => {
            const tasks = await TaskService.getOverdueTasks(ownerId);

            expect(tasks).toHaveLength(2);
        });
    });
});
