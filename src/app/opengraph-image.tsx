import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/constants";

export const alt = "Samba Siva Reddy - Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f172a 100%)",
          padding: "80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background monogram watermark */}
        <span
          style={{
            position: "absolute",
            right: "-40px",
            bottom: "-80px",
            fontSize: "500px",
            fontWeight: 900,
            color: "rgba(255,255,255,0.03)",
            letterSpacing: "-30px",
            lineHeight: 1,
          }}
        >
          SS
        </span>

        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "32px",
              fontWeight: 900,
              color: "#e2e8f0",
              letterSpacing: "-2px",
            }}
          >
            SS
          </span>
        </div>

        {/* Name */}
        <h1
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#f8fafc",
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-2px",
          }}
        >
          {siteConfig.author.name}
        </h1>

        {/* Title */}
        <p
          style={{
            fontSize: "32px",
            color: "#94a3b8",
            margin: "16px 0 0 0",
            fontWeight: 400,
          }}
        >
          {siteConfig.author.title}
        </p>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "80px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span
            style={{
              fontSize: "20px",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            sambasivareddy.in
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
