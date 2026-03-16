import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "6px",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: "20px",
            fontWeight: 900,
            color: "#e2e8f0",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginTop: "-1px",
          }}
        >
          SS
        </span>
      </div>
    ),
    { ...size }
  );
}
