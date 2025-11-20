// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    if (process.env.NODE_ENV === "production")
        throw new Error("Cannot seed production database!");

    console.log(" Seeding database...");

    // Clear existing data
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    console.log(" Cleared existing data");

    // Create users
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    const alice = await prisma.user.create({
        data: {
            email: "alice@example.com",
            username: "alice",
            password: hashedPassword,
            firstName: "Alice",
            lastName: "Johnson",
            isVerified: true,
            role: "USER",
        },
    });

    const bob = await prisma.user.create({
        data: {
            email: "bob@example.com",
            username: "bob",
            password: hashedPassword,
            firstName: "Bob",
            lastName: "Smith",
            isVerified: true,
            role: "USER",
        },
    });

    const charlie = await prisma.user.create({
        data: {
            email: "charlie@example.com",
            username: "charlie",
            password: hashedPassword,
            firstName: "Charlie",
            lastName: "Brown",
            isVerified: true,
            role: "USER",
        },
    });

    console.log("👥 Created 3 users");

    // Create projects
    const webProject = await prisma.project.create({
        data: {
            name: "E-Commerce Website",
            description: "Build a modern e-commerce platform with Next.js",
            status: "ACTIVE",
            ownerId: alice.id,
        },
    });

    const mobileProject = await prisma.project.create({
        data: {
            name: "Mobile App Development",
            description: "React Native app for task management",
            status: "ACTIVE",
            ownerId: bob.id,
        },
    });

    const marketingProject = await prisma.project.create({
        data: {
            name: "Marketing Campaign",
            description: "Q1 2024 marketing strategy and execution",
            status: "COMPLETED",
            ownerId: alice.id,
        },
    });

    console.log(" Created 3 projects");

    // Add project members
    await prisma.projectMember.createMany({
        data: [
            // E-Commerce project members
            { projectId: webProject.id, userId: alice.id, role: "OWNER" },
            { projectId: webProject.id, userId: bob.id, role: "MEMBER" },
            { projectId: webProject.id, userId: charlie.id, role: "MEMBER" },

            // Mobile App project members
            { projectId: mobileProject.id, userId: bob.id, role: "OWNER" },
            { projectId: mobileProject.id, userId: alice.id, role: "MEMBER" },

            // Marketing project members
            { projectId: marketingProject.id, userId: alice.id, role: "OWNER" },
            {
                projectId: marketingProject.id,
                userId: charlie.id,
                role: "MEMBER",
            },
        ],
    });

    console.log(" Added project members");

    // Create tasks for E-Commerce project
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    await prisma.task.createMany({
        data: [
            // E-Commerce project tasks
            {
                title: "Design homepage mockup",
                description:
                    "Create wireframes and high-fidelity designs for the homepage",
                status: "DONE",
                priority: "HIGH",
                projectId: webProject.id,
                creatorId: alice.id,
                assigneeId: charlie.id,
                completedAt: new Date(),
            },
            {
                title: "Setup authentication system",
                description:
                    "Implement JWT-based authentication with refresh tokens",
                status: "IN_PROGRESS",
                priority: "HIGH",
                projectId: webProject.id,
                creatorId: alice.id,
                assigneeId: bob.id,
                dueDate: nextWeek,
            },
            {
                title: "Integrate payment gateway",
                description: "Setup Stripe for payment processing",
                status: "TODO",
                priority: "MEDIUM",
                projectId: webProject.id,
                creatorId: alice.id,
                assigneeId: bob.id,
                dueDate: nextMonth,
            },
            {
                title: "Write API documentation",
                description: "Document all API endpoints with Swagger",
                status: "TODO",
                priority: "LOW",
                projectId: webProject.id,
                creatorId: bob.id,
                dueDate: nextMonth,
            },
            {
                title: "Fix cart bug",
                description: "Items not persisting after page refresh",
                status: "TODO",
                priority: "HIGH",
                projectId: webProject.id,
                creatorId: charlie.id,
                assigneeId: bob.id,
                dueDate: yesterday, // Overdue task
            },

            // Mobile App project tasks
            {
                title: "Setup React Native project",
                description:
                    "Initialize project with TypeScript and navigation",
                status: "DONE",
                priority: "HIGH",
                projectId: mobileProject.id,
                creatorId: bob.id,
                assigneeId: bob.id,
                completedAt: new Date(),
            },
            {
                title: "Design app UI components",
                description: "Create reusable component library",
                status: "IN_PROGRESS",
                priority: "MEDIUM",
                projectId: mobileProject.id,
                creatorId: bob.id,
                assigneeId: alice.id,
                dueDate: nextWeek,
            },
            {
                title: "Implement offline mode",
                description: "Add local storage for offline functionality",
                status: "TODO",
                priority: "MEDIUM",
                projectId: mobileProject.id,
                creatorId: bob.id,
                dueDate: nextMonth,
            },

            // Marketing project tasks (completed project)
            {
                title: "Launch social media campaign",
                description: "Facebook and Instagram ads",
                status: "DONE",
                priority: "HIGH",
                projectId: marketingProject.id,
                creatorId: alice.id,
                assigneeId: charlie.id,
                completedAt: new Date(),
            },
            {
                title: "Analyze campaign metrics",
                description: "Review ROI and engagement data",
                status: "DONE",
                priority: "MEDIUM",
                projectId: marketingProject.id,
                creatorId: alice.id,
                assigneeId: alice.id,
                completedAt: new Date(),
            },
        ],
    });

    console.log(
        " Created tasks with various statuses, priorities, and due dates"
    );

    console.log("\n Seed completed successfully!\n");
    console.log(" Login credentials:");
    console.log("   Email: alice@example.com");
    console.log("   Email: bob@example.com");
    console.log("   Email: charlie@example.com");
    console.log("   Password: Password123!\n");
    console.log(" Summary:");
    console.log("   - 3 users created");
    console.log("   - 3 projects (1 active, 1 completed)");
    console.log("   - 10 tasks (various statuses including overdue)");
}

main()
    .catch(e => {
        console.error("Seed failed: ", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
