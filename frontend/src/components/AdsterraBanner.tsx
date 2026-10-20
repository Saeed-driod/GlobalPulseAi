"use client";

import React, { useEffect, useRef } from "react";

interface AdsterraBannerProps {
  className?: string;
  label?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({
  className = "",
  label = "Sponsored Intelligence",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset container on mount to avoid duplicate iframes on re-renders
    container.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.width = "300";
    iframe.height = "250";
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
              <base target="_blank">
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 300px;
                  height: 250px;
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
                  'key' : 'f9d768ccca70ee81246bd2b08139e9d0',
                  'format' : 'iframe',
                  'height' : 250,
                  'width' : 300,
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="https://bicea.org/22/f9d768ccca70ee81246bd2b08139e9d0"></script>
            </body>
          </html>
        `);
        doc.close();
      }
    } catch (e) {
      console.warn("Adsterra iframe initialization error:", e);
    }
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center my-6 ${className}`}>
      <div className="w-[300px] flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
          {label}
        </span>
        <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
          AD
        </span>
      </div>
      <div
        ref={containerRef}
        className="w-[300px] h-[250px] bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center"
      />
    </div>
  );
};
