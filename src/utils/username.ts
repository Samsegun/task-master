import { randomInt } from "node:crypto";
import prisma from "../utils/prisma";

function generateRandomString(length: number): string {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[randomInt(0, chars.length)];
    }
    return result;
}

function sanitizeBase(str: string) {
    const sanitized = str
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase()
        .slice(0, 12);
    return sanitized || "user";
}

export async function generateUniqueUsername(
    preferred?: string,
): Promise<string> {
    const base = sanitizeBase(preferred || "user");

    // 1. Try the base name first
    const firstCheck = await prisma.user.findUnique({
        where: { username: base },
        select: { id: true },
    });
    if (!firstCheck) return base;

    // 2. Loop with random suffixes
    const MAX_ATTEMPTS = 5;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const candidate = `${base}-${generateRandomString(6)}`;
        const exists = await prisma.user.findUnique({
            where: { username: candidate },
            select: { id: true },
        });

        if (!exists) return candidate;
    }

    // 3. Fallback
    return `${base}-${generateRandomString(10)}`;
}
