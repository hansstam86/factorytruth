import { ImageResponse } from "next/og";

export const alt = "Factory Truth — See what really happens in the factory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0c0f14 0%, #161b24 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: 48,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#e6e9ef",
              letterSpacing: "-0.02em",
            }}
          >
            Factory Truth
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#7eb8da",
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            See what really happens in the factory.
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#8b92a4",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Factories share it. You see it.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
