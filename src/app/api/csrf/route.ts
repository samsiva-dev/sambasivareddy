import { NextRequest, NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

// GET /api/csrf — generate a CSRF token for client-side forms
export async function GET(request: NextRequest) {
  try {
    const token = await generateCsrfToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
