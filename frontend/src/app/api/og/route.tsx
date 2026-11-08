import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTitle = searchParams.get("title") || "Global Breaking News & Analysis";
  const title = rawTitle.replace(/\s*\|\s*GlobalPulse AI/gi, "").trim();
  const category = (searchParams.get("category") || "AI & Tech").toUpperCase();

  // Category accent palette
  let accentColor = "#06b6d4"; // cyan
  if (category.includes("MARKET")) accentColor = "#10b981"; // emerald
  if (category.includes("SPORT")) accentColor = "#f59e0b"; // amber
  if (category.includes("SCIENCE")) accentColor = "#a855f7"; // purple
  if (category.includes("POLITIC")) accentColor = "#6366f1"; // indigo
  if (category.includes("ENTERTAIN")) accentColor = "#ec4899"; // pink

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#080c14",
          padding: "54px 64px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Chromatic Top Accent Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: `linear-gradient(90deg, ${accentColor}, #6366f1, #ec4899)`,
          }}
        />

        {/* Header: Logo and Category Badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#22d3ee",
                fontWeight: "900",
                fontSize: "19px",
              }}
            >
              GP
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#ffffff", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                GlobalPulse <span style={{ color: "#22d3ee" }}>AI</span>
              </span>
              <span style={{ color: "#94a3b8", fontSize: "11px", fontFamily: "monospace" }}>
                INDEPENDENT NEWSROOM
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: `1px solid ${accentColor}`,
              color: accentColor,
              fontSize: "13px",
              fontWeight: "700",
              fontFamily: "monospace",
              letterSpacing: "1px",
            }}
          >
            {category}
          </div>
        </div>

        {/* Center: Editorial Headline */}
        <div style={{ display: "flex", flexDirection: "column", margin: "24px 0", width: "100%" }}>
          <div
            style={{
              fontSize: title.length > 70 ? "44px" : "54px",
              fontWeight: "800",
              color: "#ffffff",
              lineHeight: "1.18",
              letterSpacing: "-1px",
              maxHeight: "310px",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer: Editorial Attribution */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "20px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
              }}
            />
            <span style={{ color: "#cbd5e1", fontSize: "15px", fontWeight: "600" }}>
              GlobalPulse AI Desk • Verified Reporting
            </span>
          </div>
          <span style={{ color: "#64748b", fontSize: "14px", fontFamily: "monospace" }}>
            globalpulseai.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

