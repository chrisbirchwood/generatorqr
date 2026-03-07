import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Generator kodow QR online - darmowe narzedzie";
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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #18181b 50%, #0a0a0a 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* QR icon */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "40px",
          }}
        >
          {[0, 1, 2].map((row) => (
            <div key={row} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[0, 1, 2].map((col) => (
                <div
                  key={col}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    background:
                      (row + col) % 2 === 0
                        ? "linear-gradient(135deg, #d4af37, #c5a028)"
                        : "rgba(212, 175, 55, 0.15)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "64px",
            fontWeight: 800,
            background: "linear-gradient(90deg, #d4af37, #c5a028, #d4af37)",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "-2px",
            marginBottom: "16px",
          }}
        >
          Generator QR
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "#a1a1aa",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Darmowy generator kodow QR online. Wklej link, wygeneruj i pobierz.
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: "32px",
            fontSize: "16px",
            color: "#52525b",
          }}
        >
          qr.birchcode.com
        </div>
      </div>
    ),
    { ...size }
  );
}
