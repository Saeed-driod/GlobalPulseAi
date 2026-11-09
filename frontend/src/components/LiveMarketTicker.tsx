"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Zap, Sparkles } from "./Icons";

interface TickerAsset {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
}

export const LiveMarketTicker: React.FC = () => {
  const [assets, setAssets] = useState<TickerAsset[]>([
    { symbol: "BTC", name: "Bitcoin", price: "$68,940", change: "+2.4%", isPositive: true },
    { symbol: "ETH", name: "Ethereum", price: "$2,540", change: "+1.8%", isPositive: true },
    { symbol: "SOL", name: "Solana", price: "$182.50", change: "+5.1%", isPositive: true },
    { symbol: "XAU", name: "Gold", price: "$2,748", change: "+0.4%", isPositive: true },
    { symbol: "SPX", name: "S&P 500", price: "5,864", change: "+1.2%", isPositive: true },
    { symbol: "NVDA", name: "Nvidia", price: "$138.20", change: "-0.8%", isPositive: false },
  ]);

  const [fearGreed, setFearGreed] = useState<{ value: number; sentiment: string }>({
    value: 74,
    sentiment: "Greed",
  });

  const [lastUpdated, setLastUpdated] = useState<string>("Live");

  useEffect(() => {
    let isMounted = true;

    const fetchLiveTelemetry = async () => {
      try {
        // 1. Fetch Fear & Greed Index (Free Public API)
        const fngRes = await fetch("https://api.alternative.me/fng/?limit=1").catch(() => null);
        if (fngRes && fngRes.ok) {
          const fngData = await fngRes.json();
          if (fngData?.data?.[0] && isMounted) {
            setFearGreed({
              value: parseInt(fngData.data[0].value, 10) || 72,
              sentiment: fngData.data[0].value_classification || "Greed",
            });
          }
        }

        // 2. Fetch Live Binance 24hr ticker for BTC, ETH, SOL
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

        if (isMounted) {
          const now = new Date();
          setLastUpdated(`${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} EST`);
        }
      } catch {
        // graceful fallback to state
      }
    };

    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 45000); // refresh every 45s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 mt-2">
      <div className="neu-flat p-2 sm:px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Live Pulse Indicator + Fear & Greed */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="neu-sm px-2.5 py-1 flex items-center gap-1.5 font-mono text-[10px] font-black uppercase text-[#2d3748]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE MARKETS</span>
          </div>

          {/* Fear & Greed Meter Badge */}
          <div className="neu-sm px-3 py-1 flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#718096] uppercase font-bold hidden xs:inline">
              Market Sentiment:
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  fearGreed.value >= 75
                    ? "bg-emerald-500"
                    : fearGreed.value >= 50
                    ? "bg-lime-500"
                    : fearGreed.value >= 25
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              />
              <span className="font-bold text-[11px] text-[#2d3748] font-mono">
                {fearGreed.sentiment} ({fearGreed.value}/100)
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Live Ticker Assets Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          {assets.map((item) => (
            <div
              key={item.symbol}
              className="neu-sm px-2.5 py-1 flex items-center gap-1.5 shrink-0 text-[11px] font-mono select-none"
            >
              <span className="text-[#718096] font-bold">{item.symbol}</span>
              <span className="font-semibold text-[#2d3748]">{item.price}</span>
              <span
                className={`font-bold ${
                  item.isPositive ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

