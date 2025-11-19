import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Task Master API",
            version: "1.0.0",
            description:
                "A project management API for managing projects, tasks, and team members.",
        },
        servers: [
            {
                url: "http://localhost:7000/api",
                description: "Development server",
            },
            {
                url: "/api",
                description: "Production server",
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "accessToken",
                    description: "Access token stored in HTTP-only cookie",
                },
            },
            schemas: {
                Error: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        error: {
                            type: "object",
                            properties: {
                                message: {
                                    type: "string",
                                    example: "An error occurred",
                                },
                                code: { type: "number", example: 100 },
                            },
                        },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        // username: { type: "string" },
                        // firstName: { type: "string" },
                        // lastName: { type: "string" },
                        role: {
                            type: "string",
                            enum: ["USER", "ADMIN", "MODERATOR", "SUPER_ADMIN"],
                        },
                    },
                },
                Project: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                        status: {
                            type: "string",
                            enum: ["ACTIVE", "COMPLETED", "ARCHIVED"],
                        },
                        ownerId: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                ProjectMember: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        projectId: { type: "string" },
                        userId: { type: "string" },
                        role: {
                            type: "string",
                            enum: ["OWNER", "MEMBER"],
                        },
                        joinedAt: {
                            type: "string",
                            format: "date-time",
                        },
                        user: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                email: { type: "string", format: "email" },
                            },
                        },
                    },
                },
                Task: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        status: {
                            type: "string",
                            enum: ["TODO", "IN_PROGRESS", "DONE"],
                        },
                        priority: {
                            type: "string",
                            enum: ["LOW", "MEDIUM", "HIGH"],
                        },
                        dueDate: { type: "string", format: "date-time" },
                        assigneeId: { type: "string" },
                        creatorId: { type: "string" },
                        projectId: { type: "string" },
                        completedAt: { type: "string", format: "date-time" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
            },
        },
        security: [{ cookieAuth: [] }],
        tags: [
            { name: "Auth", description: "Authentication endpoints" },
            { name: "Projects", description: "Project management endpoints" },
            {
                name: "Project Members",
                description: "Project member management",
            },
            { name: "Tasks", description: "Task management endpoints" },
            { name: "Users", description: "User management endpoints" },
        ],
    },
    // apis: ["./src/routes/*.ts", "./src/routes/v1/*.ts"],
    apis: ["./src/docs/*.yaml"],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
    app.use(
        "/api/docs",
        swaggerUi.serve,
        swaggerUi.setup(specs, { explorer: true })
    );
    console.log("Swagger docs available at /api/docs");
};
