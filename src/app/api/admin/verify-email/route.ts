import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resend, emailFromHello } from "@/lib/resend";
import crypto from "crypto";

// In-memory store for verification codes (per-server, short-lived)
const verificationCodes = new Map<
  string,
  { code: string; expiresAt: number; token: string | null }
>();

// Cleanup expired codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of verificationCodes) {
    if (entry.expiresAt < now) verificationCodes.delete(key);
  }
}, 60_000);

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// POST /api/admin/verify-email — send a verification code to admin email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = session.user?.email;
    if (!adminEmail) {
      return NextResponse.json({ error: "No admin email found" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "send") {
      // Rate limit: one code per 60 seconds
      const existing = verificationCodes.get(adminEmail);
      if (existing && existing.expiresAt - 4 * 60 * 1000 > Date.now()) {
        return NextResponse.json(
          { error: "Code already sent. Please wait before requesting a new one." },
          { status: 429 }
        );
      }

      const code = generateCode();
      verificationCodes.set(adminEmail, {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        token: null,
      });

      // Send code via email
      if (resend) {
        await resend.emails.send({
          from: emailFromHello,
          to: adminEmail,
          subject: "Admin Verification Code",
          text: `Your verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore this email.`,
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
              <h2 style="margin-bottom: 8px;">Verification Code</h2>
              <p style="color: #666; margin-bottom: 20px;">Use this code to reveal subscriber emails:</p>
              <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px;">${code}</div>
              <p style="color: #999; font-size: 13px; margin-top: 16px;">Expires in 5 minutes. If you didn't request this, ignore this email.</p>
            </div>
          `,
        });
      } else {
        // Fallback: log code in development
        console.log(`[DEV] Admin verification code for ${adminEmail}: ${code}`);
      }

      return NextResponse.json({ message: "Verification code sent to your email" });
    }

    if (action === "verify") {
      const { code } = body;
      if (!code || typeof code !== "string") {
        return NextResponse.json({ error: "Code required" }, { status: 400 });
      }

      const entry = verificationCodes.get(adminEmail);
      if (!entry || entry.expiresAt < Date.now()) {
        verificationCodes.delete(adminEmail);
        return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 410 });
      }

      if (entry.code !== code.trim()) {
        return NextResponse.json({ error: "Invalid code" }, { status: 403 });
      }

      // Generate a session token valid for 30 minutes
      const token = generateToken();
      entry.token = token;
      entry.expiresAt = Date.now() + 30 * 60 * 1000; // extend for 30 min

      return NextResponse.json({ token, expiresIn: 30 * 60 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Check if a reveal token is valid for the given admin email */
export function isValidRevealToken(adminEmail: string, token: string): boolean {
  const entry = verificationCodes.get(adminEmail);
  if (!entry || !entry.token || entry.expiresAt < Date.now()) return false;
  return entry.token === token;
}
