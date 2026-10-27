"use client";

import React, { useEffect, useRef } from "react";

export type AdsterraUnitSize = "300x250" | "320x50" | "728x90";

interface AdsterraBannerProps {
  className?: string;
  label?: string;
  size?: AdsterraUnitSize;
}

const AD_CONFIGS: Record<
  AdsterraUnitSize,
  { key: string; width: number; height: number; scriptSrc: string }
> = {
  "300x250": {
    key: "f7126291d68f9df3872005cf005de9aa",
    width: 300,
    height: 250,
    scriptSrc: "https://bauval.org/22/f7126291d68f9df3872005cf005de9aa",
  },
  "320x50": {
    key: "4d84272ac95f2b5caebba6acca449427",
    width: 320,
    height: 50,
    scriptSrc: "https://bauval.org/22/4d84272ac95f2b5caebba6acca449427",
  },
  "728x90": {
    key: "4d84272ac95f2b5caebba6acca449427",
    width: 320,
    height: 50,
    scriptSrc: "https://bauval.org/22/4d84272ac95f2b5caebba6acca449427",
  },
};

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({
  className = "",
  label = "Sponsored Intelligence",
  size = "300x250",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = AD_CONFIGS[size] || AD_CONFIGS["300x250"];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset container on mount to avoid duplicate iframes on re-renders
    container.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.width = `${config.width}`;
    iframe.height = `${config.height}`;
    iframe.title = "Sponsored Advertisement";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.setAttribute("scrolling", "no");

    container.appendChild(iframe);

    try {
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="referrer" content="no-referrer-when-downgrade">
              <base target="_blank">
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  width: ${config.width}px;
                  height: ${config.height}px;
                  overflow: hidden;
                  background-color: transparent;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
              </style>
            </head>
            <body>
              <script type="text/javascript">
                atOptions = {
                  'key' : '${config.key}',
                  'format' : 'iframe',
                  'height' : ${config.height},
                  'width' : ${config.width},
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="${config.scriptSrc}"></script>
            </body>
          </html>
        `);
        doc.close();
      }
    } catch (e) {
      console.warn("Adsterra iframe initialization error:", e);
    }
  }, [config, size]);

  const isLeaderboard = size === "728x90";

  return (
    <div className={`flex flex-col items-center justify-center my-6 ${className}`}>
      <div
        style={{ width: `${config.width}px` }}
        className="max-w-full flex items-center justify-between mb-1.5 px-1"
      >
        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
          {label}
        </span>
        <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
          AD
        </span>
      </div>

      {/* Responsive outer container for Leaderboard on mobile screens */}
      <div className={isLeaderboard ? "w-full max-w-[728px] overflow-x-auto flex justify-center py-1" : ""}>
        <div
          ref={containerRef}
          style={{ width: `${config.width}px`, height: `${config.height}px` }}
          className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center shrink-0"
        />
      </div>
    </div>
  );
};

