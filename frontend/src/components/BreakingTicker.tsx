"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { ChevronRight } from "./Icons";

interface BreakingTickerProps {
  articles: Article[];
}

interface TickerAsset {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ articles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayArticles = articles.length > 0 ? articles : [];

  const [assets, setAssets] = useState<TickerAsset[]>([
    { symbol: "BTC", price: "$76,440", change: "-0.4%", isPositive: false },
    { symbol: "ETH", price: "$2,250", change: "-0.1%", isPositive: false },
    { symbol: "SOL", price: "$91.20", change: "-0.7%", isPositive: false },
    { symbol: "XAU", price: "$2,748", change: "+0.4%", isPositive: true },
  ]);

  const [fearGreed, setFearGreed] = useState<{ value: number; sentiment: string }>({
    value: 34,
    sentiment: "Fear",
  });

  // Cycle breaking articles every 5 seconds
  useEffect(() => {
    if (displayArticles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayArticles.length]);

  // Fetch live market data (Binance + Alternative.me Fear & Greed)
  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const fngRes = await fetch("https://api.alternative.me/fng/?limit=1").catch(() => null);
        if (fngRes && fngRes.ok) {
          const fngData = await fngRes.json();
          if (fngData?.data?.[0] && isMounted) {
            setFearGreed({
              value: parseInt(fngData.data[0].value, 10) || 34,
              sentiment: fngData.data[0].value_classification || "Fear",
            });
          }
        }

        const cryptoRes = await fetch(
          'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]'
        ).catch(() => null);

        if (cryptoRes && cryptoRes.ok && isMounted) {
          const list: any[] = await cryptoRes.json();
          if (Array.isArray(list) && list.length > 0) {
            const mapped: Record<string, { price: string; change: string; isPositive: boolean }> = {};
            for (const item of list) {
              const p = parseFloat(item.lastPrice);
              const c = parseFloat(item.priceChangePercent);
              mapped[item.symbol] = {
                price: p >= 1000 ? `$${Math.round(p).toLocaleString()}` : `$${p.toFixed(2)}`,
                change: `${c >= 0 ? "+" : ""}${c.toFixed(1)}%`,
                isPositive: c >= 0,
              };
            }

            setAssets((prev) =>
              prev.map((a) => {
                const key = `${a.symbol}USDT`;
                if (mapped[key]) {
                  return {
                    ...a,
                    price: mapped[key].price,
                    change: mapped[key].change,
                    isPositive: mapped[key].isPositive,
                  };
                }
                return a;
              })
            );
          }
        }
      } catch {
        // quiet fallback
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (displayArticles.length === 0) return null;
  const current = displayArticles[currentIndex];

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 mt-1.5">
      <div className="neu-flat py-1.5 px-3 sm:px-4 flex items-center justify-between gap-3 text-xs overflow-hidden">
        {/* Left: Breaking Wire Live Badge & Current Story */}
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
          <div className="neu-sm px-2.5 py-0.5 flex items-center gap-1.5 text-red-600 font-black tracking-widest text-[10px] uppercase shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span>WIRE</span>
          </div>

          <Link
            href={`/news/${current.slug}`}
            className="truncate text-[#2d3748] hover:text-[#1a8cff] font-medium transition-colors flex items-center gap-1 group flex-1 min-w-0"
          >
            <span className="font-semibold text-xs group-hover:underline underline-offset-2 truncate">
              {current.title}
            </span>
            <ChevronRight className="w-3 h-3 text-[#718096] group-hover:text-[#1a8cff] shrink-0" />
          </Link>
        </div>

        {/* Right: Compact Live Financial Telemetry (Fear/Greed + Live Assets) */}
        <div className="hidden md:flex items-center gap-2 shrink-0 pl-3 border-l border-[#b8bec7]/40 font-mono text-[10px]">
          {/* Sentiment Badge */}
          <div className="neu-sm px-2 py-0.5 flex items-center gap-1 text-[10px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                fearGreed.value >= 60
                  ? "bg-emerald-500"
                  : fearGreed.value >= 40
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-[#718096] font-bold">
              {fearGreed.sentiment} ({fearGreed.value})
            </span>
          </div>

          {/* Crypto & Gold rates */}
          {assets.map((item) => (
            <div key={item.symbol} className="neu-sm px-2 py-0.5 flex items-center gap-1 text-[10px]">
              <span className="text-[#718096] font-bold">{item.symbol}</span>
              <span className="font-semibold text-[#2d3748]">{item.price}</span>
              <span className={`font-bold ${item.isPositive ? "text-emerald-600" : "text-red-500"}`}>
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
