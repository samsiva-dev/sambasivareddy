import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      // If Cloudinary is not configured, return a placeholder
      return NextResponse.json({
        url: `https://placehold.co/800x400/1a1a2e/ffffff?text=${encodeURIComponent(file.name)}`,
        message: "Cloudinary not configured. Using placeholder.",
      });
    }

    // Upload to Cloudinary
    const timestamp = Math.round(new Date().getTime() / 1000);
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha256")
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", dataURI);
    cloudinaryForm.append("api_key", apiKey);
    cloudinaryForm.append("timestamp", timestamp.toString());
    cloudinaryForm.append("signature", signature);
    cloudinaryForm.append("folder", "blog");

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryForm,
      }
    );

    if (!uploadRes.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const result = await uploadRes.json();

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
