import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          borderRadius: "36px",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: "90px",
            fontWeight: 900,
            color: "#e2e8f0",
            letterSpacing: "-6px",
            lineHeight: 1,
          }}
        >
          SS
        </span>
        {/* Accent dot */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            right: "28px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#e2e8f0",
            opacity: 0.8,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
