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
          background: "#161513",
        }}
      >
        <svg width="118" height="118" viewBox="0 0 32 32">
          <path fill="#b89a68" d="M8.2 13.4 16 25.2 23.8 13.4Z" />
          <path fill="#cbb489" d="M8.2 13.4 12.2 7.6h7.6l4 5.8Z" />
          <path fill="#e2c9a0" d="M16 7.6 23.8 13.4H16Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
