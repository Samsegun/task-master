# Task-Master API Documentation

A REST API for a collaborative project management tool. This service powers the "Task-Master" application, handling everything from user authentication and project creation to task assignments and role management.

## Key Features

-   **Authentication:** Secure JWT (Access & Refresh) token-based auth.
-   **Project Management:** Full CRUD for collaborative projects.
-   **Task Organization:** Full CRUD for tasks, including status, priority, and assignments.
-   **Role-Based Access:** Project-level roles (OWNER, MEMBER) to control permissions.
-   **Validation:** End-to-end data validation with Zod.
-   **API Documentation:** Interactive API docs powered by Swagger/OpenAPI.

## API Documentation

A complete, interactive API reference is available for all endpoints. Once the server is running, you can access the live documentation locally at:

**[http://localhost:7000/api/docs](http://localhost:7000/api/docs)**

## 🛠️ Tech Stack

-   **Core:** Node.js, Express, TypeScript
-   **Database ORM:** Prisma
-   **Database:** PostgreSQL (Production/Dev/Test)
-   **Authentication:** Custom JWT Strategy (http-only cookies)
-   **Email:** Nodemailer (ethereal for development and gmail for production)
-   **Validation:** Zod
-   **Testing:** Jest

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing.

### 1. Prerequisites

-   Node.js (v18 or newer)
-   pnpm

### 2. Clone the Repository

```bash
git clone https://github.com/samsegun/task-master.git
cd task-master
```

### 3. Install Dependencies

```bash
pnpm add
```

### 4. Set up environment

This project uses postgresql for development and testing.
First, copy the example environment file:

```bash
cp .env.sample .env
```

Open the .env file and fill in the required variables (like JWT_ACCESS_SECRET and so on). The DATABASE_URL
and DIRECT_URL should be set for postgresql:

```bash
# .env
DATABASE_URL="postgresql://username:password@pooling-host:5432/dbname"
DIRECT_URL="postgresql://username:password@direct-host:5432/dbname"
# ...other env variables, JWT and EMAIL secrets
```

## Important Note on DATABASE_URL and DIRECT_URL

For production environments, especially when using services like Supabase, Prisma may sometimes use `DATABASE_URL` inconsistently. To ensure proper functionality, you may need to explicitly set both `DATABASE_URL` and `DIRECT_URL` in your ` .env` file.

-   `DATABASE_URL`: Primary connection string Prisma uses for migrations and general database operations.
-   `DIRECT_URL`: Optional connection string that can be used to in place of DATABASE_URL when necessary.

If you're using a service like Supabase with connection pooling enabled, ensure that:

-   `DATABASE_URL` points to the connection pool.
-   `DIRECT_URL` points to the direct database connection (bypassing the pool).

### 5. Run Database Migrations

This command will set up all the tables based on your prisma/schema.prisma file:

```bash
pnpm run migrate:dev
```

### 6. Start the Development Server

```bash
pnpm run dev
```

Server will be running on http://localhost:7000 .

### 7. Run Tests

```bash
pnpm run test
```

## Feedback Request

This is my first major backend project, and I’m eager to learn and improve. If you’re a senior developer or have experience with building scalable backend systems, I’d greatly appreciate your feedback on this project. Please feel free to point out areas where I can improve, whether it’s code structure, best practices, performance, or anything else. Your insights will help me grow as a developer. Thank you!
