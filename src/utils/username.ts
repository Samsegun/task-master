import { customAlphabet } from "nanoid";
import prisma from "../utils/prisma";

// long nanoid reduces collision
const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

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

    // try the base name first (no suffix)
    const firstCheck = await prisma.user.findUnique({
        where: { username: base },
        select: { id: true },
    });
    if (!firstCheck) return base;

    // loop with random suffixes
    const MAX_ATTEMPTS = 5;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const candidate = `${base}-${nano()}`;
        const exists = await prisma.user.findUnique({
            where: { username: candidate },
            select: { id: true },
        });

        if (!exists) return candidate;
    }

    // final Fallback: if we are still hitting collisions,
    // use a longer ID to guarantee uniqueness.
    return `${base}-${customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10)()}`;
}
