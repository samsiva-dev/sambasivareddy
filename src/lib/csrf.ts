import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";

/**
 * Generate a CSRF token and store it in the database.
 * Returns the token string to embed in forms/meta tags.
 */
export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.csrfToken.create({
    data: { token, expiresAt },
  });

  // Cleanup expired tokens (fire-and-forget)
  prisma.csrfToken
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});

  return token;
}

/**
 * Validate a CSRF token. Returns true if valid, false otherwise.
 * Deletes the token after successful validation (single-use).
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  try {
    const record = await prisma.csrfToken.findUnique({ where: { token } });

    if (!record) return false;
    if (record.expiresAt < new Date()) {
      await prisma.csrfToken.delete({ where: { id: record.id } }).catch(() => {});
      return false;
    }

    // Single-use: delete after validation
    await prisma.csrfToken.delete({ where: { id: record.id } }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
