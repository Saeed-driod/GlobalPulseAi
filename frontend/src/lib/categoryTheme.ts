export interface CategoryTheme {
  name: string;
  badge: string;
  pillActive: string;
  pillHover: string;
  textColor: string;
  hoverTextColor: string;
  accentGradient: string;
  borderGlow: string;
  dotColor: string;
}

export function getCategoryTheme(category?: string): CategoryTheme {
  const norm = (category || "").toLowerCase();

  // 1. Markets, Economy & Crypto -> High-energy Emerald / Mint
  if (
    norm.includes("market") ||
    norm.includes("finance") ||
    norm.includes("crypto") ||
    norm.includes("econom") ||
    norm.includes("wall st") ||
    norm.includes("stock")
  ) {
    return {
      name: "Global Markets",
      badge:
        "bg-emerald-950/85 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]",
      pillActive:
        "bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-emerald-500/10 border-emerald-400 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.4)]",
      pillHover: "hover:border-emerald-400/50 hover:text-emerald-300",
      textColor: "text-emerald-400",
      hoverTextColor: "group-hover:text-emerald-300",
      accentGradient: "from-emerald-400 to-teal-500",
      borderGlow: "group-hover:border-emerald-500/40",
      dotColor: "bg-emerald-400",
    };
  }

  // 2. Future Science & Quantum / Space -> Cosmic Violet / Neon Purple
  if (
    norm.includes("science") ||
    norm.includes("space") ||
    norm.includes("physics") ||
    norm.includes("biotech") ||
    norm.includes("quantum") ||
    norm.includes("fusion")
  ) {
    return {
      name: "Future Science",
      badge:
        "bg-purple-950/85 border-purple-400/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]",
      pillActive:
        "bg-gradient-to-r from-purple-500/25 via-violet-500/20 to-purple-500/10 border-purple-400 text-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.4)]",
      pillHover: "hover:border-purple-400/50 hover:text-purple-300",
      textColor: "text-purple-400",
      hoverTextColor: "group-hover:text-purple-300",
      accentGradient: "from-purple-400 to-violet-500",
      borderGlow: "group-hover:border-purple-500/40",
      dotColor: "bg-purple-400",
    };
  }

  // 3. Global Sports & Athletics -> Flaming Sunset Amber / Fiery Orange
  if (
    norm.includes("sport") ||
    norm.includes("athletic") ||
    norm.includes("football") ||
    norm.includes("soccer") ||
    norm.includes("nba") ||
    norm.includes("f1") ||
    norm.includes("olympic")
  ) {
    return {
      name: "Global Sports",
      badge:
        "bg-amber-950/85 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
      pillActive:
        "bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-500/10 border-amber-400 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.4)]",
      pillHover: "hover:border-amber-400/50 hover:text-amber-300",
      textColor: "text-amber-400",
      hoverTextColor: "group-hover:text-amber-300",
      accentGradient: "from-amber-400 to-orange-500",
      borderGlow: "group-hover:border-amber-500/40",
      dotColor: "bg-amber-400",
    };
  }

  // 4. Entertainment & Cinema -> Hot Rose / Neon Pink
  if (
    norm.includes("entertain") ||
    norm.includes("movie") ||
    norm.includes("cinema") ||
    norm.includes("music") ||
    norm.includes("hollywood") ||
    norm.includes("streaming") ||
    norm.includes("culture")
  ) {
    return {
      name: "Entertainment",
      badge:
        "bg-pink-950/85 border-pink-400/50 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.35)]",
      pillActive:
        "bg-gradient-to-r from-pink-500/25 via-rose-500/20 to-pink-500/10 border-pink-400 text-pink-300 shadow-[0_0_14px_rgba(236,72,153,0.4)]",
      pillHover: "hover:border-pink-400/50 hover:text-pink-300",
      textColor: "text-pink-400",
      hoverTextColor: "group-hover:text-pink-300",
      accentGradient: "from-pink-400 to-rose-500",
      borderGlow: "group-hover:border-pink-500/40",
      dotColor: "bg-pink-400",
    };
  }

  // 5. World Politics & Geopolitics -> Royal Sapphire / Indigo
  if (
    norm.includes("politic") ||
    norm.includes("geopolitic") ||
    norm.includes("diplomacy") ||
    norm.includes("summit") ||
    norm.includes("nation") ||
    norm.includes("defense")
  ) {
    return {
      name: "World Politics",
      badge:
        "bg-indigo-950/85 border-indigo-400/50 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.35)]",
      pillActive:
        "bg-gradient-to-r from-indigo-500/25 via-blue-500/20 to-indigo-500/10 border-indigo-400 text-indigo-300 shadow-[0_0_14px_rgba(99,102,241,0.4)]",
      pillHover: "hover:border-indigo-400/50 hover:text-indigo-300",
      textColor: "text-indigo-400",
      hoverTextColor: "group-hover:text-indigo-300",
      accentGradient: "from-indigo-400 to-blue-500",
      borderGlow: "group-hover:border-indigo-500/40",
      dotColor: "bg-indigo-400",
    };
  }

  // 6. All Stories / Multi-topic -> Multi-spectral Iridescent
  if (norm.includes("all")) {
    return {
      name: "All Stories",
      badge:
        "bg-cyan-950/85 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]",
      pillActive:
        "bg-gradient-to-r from-cyan-500/25 via-purple-500/20 to-pink-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(6,182,212,0.4)]",
      pillHover: "hover:border-cyan-400/50 hover:text-cyan-300",
      textColor: "text-cyan-400",
      hoverTextColor: "group-hover:text-cyan-300",
      accentGradient: "from-cyan-400 via-purple-500 to-pink-500",
      borderGlow: "group-hover:border-cyan-500/40",
      dotColor: "bg-cyan-400",
    };
  }

  // 7. Default: AI & Tech -> Electric Cyan / Neon Sky Blue
  return {
    name: category || "AI & Tech",
    badge:
      "bg-cyan-950/85 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]",
    pillActive:
      "bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.4)]",
    pillHover: "hover:border-cyan-400/50 hover:text-cyan-300",
    textColor: "text-cyan-400",
    hoverTextColor: "group-hover:text-cyan-300",
    accentGradient: "from-cyan-400 to-blue-500",
    borderGlow: "group-hover:border-cyan-500/40",
    dotColor: "bg-cyan-400",
  };
}
