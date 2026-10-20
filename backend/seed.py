from datetime import datetime, timezone, timedelta
from .database import SessionLocal, engine, Base
from .models import Article, ArticleStatus, ArticleCategory

SAMPLE_ARTICLES = [
    {
        "title": "Next-Gen Quantum-AI Chips Surge Past Silicon Limits in Autonomous Computing",
        "slug": "next-gen-quantum-ai-chips-surge-silicon-limits",
        "category": ArticleCategory.AI_TECH.value,
        "summary": """• Breakthrough optical quantum processors achieve 100x efficiency over standard silicon in enterprise neural networks.
• Key labs in Cambridge and Silicon Valley validate zero-thermal throttling during continuous trillion-parameter training.
• Commercial rollout slated for late Q4 with tier-1 cloud hyper-scalers committing initial $12B infrastructure capex.""",
        "content": """### A Paradigm Shift Beyond Silicon Architecture

In a landmark milestone for modern computing, researchers and engineering consortiums across the United States and the United Kingdom have unveiled the first commercially viable **hybrid photonic-quantum accelerator**. The architecture, engineered to process tensor workloads using light-phase modulation rather than electron flow, has demonstrated a verified **100x reduction in watt-per-token consumption**.

```
Performance Benchmark Matrix:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Architecture        Tokens/Sec/Watt   Thermal Ceiling   Latency
Legacy H100/B200    1,240             85°C              4.2ms
Photonic-Quantum    128,600           28°C (Ambient)    0.3ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Enterprise & Tier-1 Infrastructure Implications

The race between Tier-1 enterprise giants—from Microsoft Azure to AWS and Google Cloud—is shifting from raw transistor counts to interconnect efficiency. With data center energy demands threatening municipal grids across Northern Virginia and the Thames Valley, this optical breakthrough promises to slash cooling overhead by over 70%.

> *"We are no longer bound by electron resistance or thermal throttling. Computing at the speed of coherent light transforms trillion-parameter agent systems into real-time operational reality."*  
> — **Dr. Aris Thorne**, Chief Scientific Officer at Nexus Quantum Labs.

#### Market Timeline and Adoption

Initial enterprise deployments will prioritize defense telemetry, algorithmic trading infrastructure in New York and London, and autonomous vehicle safety models requiring sub-millisecond decision loops. Full general availability is slated for Q1 2027.""",
        "source_url": "https://reuters.com",
        "source_name": "Global Tech Wire",
        "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        "youtube_script": """[00:00 - 00:05] HOOK: Silicon is officially hitting the wall, and the world's most powerful AI chips just switched to light.
[00:05 - 00:15] VISUAL: Rapid 3D cut of glowing photonic quantum circuits pulsing with laser beams.
[00:15 - 00:30] NARRATION: For 50 years, computers pushed electrons through copper wires. But today, researchers validated optical chips that compute with laser light.
[00:30 - 00:45] STAT OVERLAY: 100x faster. 70% less power. Zero thermal throttling.
[00:45 - 00:55] VISUAL: Cloud data center glowing in the dark, seamless server racks.
[00:55 - 01:00] CTA: Is this the end of traditional GPUs? Subscribe to GlobalPulse AI for breaking tech intelligence!""",
        "video_path": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "youtube_video_id": "dQw4w9WgXcQ",
        "status": ArticleStatus.PUBLISHED.value,
        "views": 14250,
        "published_at": datetime.now(timezone.utc) - timedelta(hours=3),
    },
    {
        "title": "Federal Reserve & Bank of England Signal Synchronized Liquidity Shift Amid Tech Rally",
        "slug": "fed-boe-synchronized-liquidity-shift-tech-rally",
        "category": ArticleCategory.GLOBAL_MARKETS.value,
        "summary": """• Central bank chiefs in Washington and London coordinate policy commentary hinting at adjusted reserve targets.
• Global equity indexes react with sharp upward volume across semiconductor and fintech heavyweights.
• Yield curves flatten as institutional debt desks rebalance portfolios in anticipation of autumn policy easing.""",
        "content": """### Synchronized Monetary Signals from New York to London

Global financial markets received a decisive boost this morning as coordinated communications from both Federal Reserve governors and the Bank of England's Monetary Policy Committee signaled an impending recalibration of interbank liquidity buffers.

#### What Drove the Policy Pivot?

1. **Subdued Core Inflation Prints**: Both US and UK core PCE figures have decelerated toward the 2.1% target corridor faster than conservative models anticipated.
2. **Productivity Multipliers**: Emerging AI productivity dividends in white-collar services have mitigated wage-push inflationary pressures.
3. **Sovereign Debt Absorption**: Central banks seek to ensure orderly refinancing schedules for maturing 10-year benchmark bonds.

#### Wall Street & City of London Market Reaction

Equities rallied sharply throughout morning trading. The S&P 500 added **1.4%**, while the FTSE 100 touched fresh multi-month highs driven by banking balance sheets and energy infrastructure allocations.

Institutional analysts at Goldman Sachs and Barclays noted that cross-border institutional capital flows are rotating decisively out of short-term cash yields and back into risk-weighted long duration tech equities.""",
        "source_url": "https://bloomberg.com",
        "source_name": "Bloomberg Markets Terminal",
        "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
        "youtube_script": """[00:00 - 00:06] HOOK: The Federal Reserve and Bank of England just made a coordinated move that Wall Street wasn't expecting.
[00:06 - 00:18] VISUAL: Trading floors in New York and London flashing green ticker numbers.
[00:18 - 00:32] NARRATION: For the first time this cycle, central bank chiefs signaled a synchronized liquidity shift. Core inflation is plunging, and productivity is surging.
[00:32 - 00:46] ON-SCREEN GRAPHIC: S&P 500 +1.4% | FTSE 100 Surge | 10-Year Bond Yields drop.
[00:46 - 00:55] NARRATION: Billions of institutional dollars are already fleeing cash piles back into growth assets.
[00:55 - 01:00] CTA: Follow GlobalPulse AI for real-time macro analysis before the market opens tomorrow.""",
        "video_path": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "youtube_video_id": "3JZ_D3ELwOQ",
        "status": ArticleStatus.PUBLISHED.value,
        "views": 8940,
        "published_at": datetime.now(timezone.utc) - timedelta(hours=7),
    },
    {
        "title": "Strategic Mineral Corridors: Transatlantic Alliance Inks $40B Rare Earth Supply Pact",
        "slug": "strategic-mineral-corridors-transatlantic-alliance-rare-earth-pact",
        "category": ArticleCategory.GEOPOLITICS.value,
        "summary": """• US, UK, Australia, and Canada formalize unified sovereign procurement pact for critical heavy rare earths.
• Agreement establishes fixed-price supply guarantees for neodymium, dysprosium, and battery-grade lithium.
• Move insulates Western defense, aerospace, and semiconductor industries against single-source export embargoes.""",
        "content": """### Rebuilding Western Supply Sovereignty

In what diplomatic insiders are calling the most consequential industrial security agreement of the decade, representatives from the United States, the United Kingdom, Australia, and Canada have finalized the **$40 Billion Transatlantic Critical Minerals Accord**.

The multilateral pact directly addresses the critical bottleneck in high-purity rare earth elements required for advanced fighter radar systems, electric vehicle drivetrains, and precision guidance optics.

#### Core Pillars of the Agreement:

* **Sovereign Strategic Stockpiling**: Member nations will maintain a rolling 18-month strategic reserve of dysprosium and terbium in secure domestic facilities.
* **Capital Guarantee Facilities**: Up to $18 billion in concessionary debt financing will back mining and advanced chemical refining sites in Western Australia and Northern Canada.
* **Direct Trade Corridor**: Zero-tariff greenlanes for refined oxides entering certified defense contractors across North America and Great Britain.

This pact marks a definitive shift from just-in-time commercial supply chains to fortified, resilient security networks.""",
        "source_url": "https://ft.com",
        "source_name": "Financial Times Diplomatic Wire",
        "image_url": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
        "youtube_script": """[00:00 - 00:05] HOOK: A secret $40 billion alliance just redrew the global balance of power.
[00:05 - 00:16] VISUAL: High-tech mineral extraction and diplomatic signatures in Washington.
[00:16 - 00:30] NARRATION: The US, UK, and Australia just signed a historic rare-earth pact to secure the elements that power every stealth jet, supercomputer, and EV battery.
[00:30 - 00:45] MAP GRAPHIC: Mining corridors flowing from Australia and Canada into US & UK advanced manufacturing hubs.
[00:45 - 00:55] NARRATION: This completely breaks single-source monopolies on high-tech metals forever.
[00:55 - 01:00] CTA: Stay ahead of global power shifts with GlobalPulse AI.""",
        "video_path": "/media/videos/rare-earth-pact.mp4",
        "youtube_video_id": None,
        "status": ArticleStatus.VIDEO_READY.value,
        "views": 3200,
        "published_at": None,
    },
    {
        "title": "Breakthrough in Clean Fusion Energy: Net-Gain Stability Sustained for Record 120 Minutes",
        "slug": "clean-fusion-energy-breakthrough-net-gain-stability-record",
        "category": ArticleCategory.FUTURE_SCIENCE.value,
        "summary": """• Advanced superconducting magnetic tokamak sustains Q>1.4 net energy output for two continuous hours.
• Eliminates core plasma instability barriers that challenged fusion scientists for over half a century.
• Pilot industrial grid interconnection trial announced for early 2030 in collaboration with national laboratories.""",
        "content": """### Two Continuous Hours of Artificial Starfire

Physicists and nuclear engineers operating the world's most advanced high-temperature superconducting tokamak have achieved a milestone widely considered the holy grail of clean energy: **uninterrupted net-positive fusion plasma sustained for over 120 continuous minutes**.

The reactor generated **1.45 units of thermal energy for every 1.0 unit of input energy injected**, holding the core temperature at 150 million degrees Celsius without damaging the first-wall divertor tiles.

#### The Breakthrough Mechanism

Previous attempts suffered from sudden plasma disruption events caused by magnetic field turbulence. The engineering team deployed a closed-loop neural controller running at 50,000 Hertz, predicting plasma drift 30 milliseconds before turbulence could form and steering radiofrequency heating waves to damp out instabilities in real time.

```
Reactor Telemetry Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Parameter                 Previous Record     New Record
Plasma Duration           1,056 sec (~17m)    7,200 sec (120m)
Energy Gain Factor (Q)    1.15                1.45 (Stable)
Core Plasma Temp          120M °C             152M °C
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

With zero carbon emissions, zero long-lived radioactive waste, and virtually limitless fuel derived from seawater, clean baseline power for humanity has taken its most credible leap into reality.""",
        "source_url": "https://nature.com",
        "source_name": "International Science Monitor",
        "image_url": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
        "youtube_script": """[00:00 - 00:06] HOOK: Scientists just held an artificial miniature sun for two solid hours—and it produced more energy than it used.
[00:06 - 00:18] VISUAL: Swirling purple and gold magnetic plasma inside a spherical tokamak.
[00:18 - 00:32] NARRATION: For 70 years, nuclear fusion was 'always 30 years away.' Today, that joke died. A record 120-minute sustained net-energy burn has been confirmed.
[00:32 - 00:46] VISUAL: Neural network adjusting magnetic confinement coils in microsecond intervals.
[00:46 - 00:55] NARRATION: Limitless, zero-carbon, fail-safe energy is no longer science fiction—it is engineering reality.
[00:55 - 01:00] CTA: Hit follow on GlobalPulse AI for daily scientific breakthroughs.""",
        "video_path": None,
        "youtube_video_id": None,
        "status": ArticleStatus.DRAFT.value,
        "views": 410,
        "published_at": None,
    }
]

def seed_database():
    """Seed the database with sample articles if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(Article).count()
        if count == 0:
            for item in SAMPLE_ARTICLES:
                article = Article(**item)
                db.add(article)
            db.commit()
            print(f"Successfully seeded {len(SAMPLE_ARTICLES)} articles into database.")
        else:
            print(f"Database already has {count} articles. Skipping seed.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
