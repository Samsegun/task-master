# Task-Master API Documentation

A REST API for a collaborative project management tool. This service powers the "Task-Master" application, handling everything from user authentication and project creation to task assignments and role management.

## ✨ Key Features

* **Authentication:** Secure JWT (Access & Refresh) token-based auth.
* **Project Management:** Full CRUD for collaborative projects.
* **Task Organization:** Full CRUD for tasks, including status, priority, and assignments.
* **Role-Based Access:** Project-level roles (OWNER, MEMBER) to control permissions.
* **Validation:** End-to-end data validation with Zod.
* **API Documentation:** Interactive API docs powered by Swagger/OpenAPI.

## 🚀 API Documentation



A complete, interactive API reference is available for all endpoints. Once the server is running, you can access the live documentation locally at:

**[http://localhost:7000/api/docs](http://localhost:7000/api/docs)**

## 🛠️ Tech Stack

* **Core:** Node.js, Express, TypeScript
* **Database ORM:** Prisma 
* **Database:** PostgreSQL (Production/Dev/Test)
* **Authentication:** Custom JWT Strategy
* **Validation:** Zod
* **Testing:** Jest

## ⚙️ Getting Started

Follow these instructions to get the project running on your local machine for development and testing.

### 1. Prerequisites

* Node.js (v18 or newer)
* pnpm

### 2. Clone the Repository

```bash
git clone [https://github.com/](https://github.com/)samsegun/task-master.git
cd task-master