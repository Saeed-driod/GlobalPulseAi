"""
GlobalPulse AI - Unified Editorial & Publication Configuration
All tunable editorial rules, limits, categories, and safety gates in one place.
"""

from typing import List, Dict

# Maximum number of articles to publish per day (UTC)
# Enforces quality over quantity
DAILY_PUBLISHING_CAP: int = 10

# Fixed editorial categories for strict content classification
FIXED_CATEGORIES: List[str] = [
    "AI & Tech",
    "Markets",
    "World Politics",
    "Science",
    "Sports",
    "Entertainment",
]

# Category slug mapping for URLs: /category/{slug}
CATEGORY_SLUG_MAP: Dict[str, str] = {
    "ai-tech": "AI & Tech",
    "markets": "Markets",
    "world-politics": "World Politics",
    "science": "Science",
    "sports": "Sports",
    "entertainment": "Entertainment",
}

# Reverse mapping: Category Name -> Slug
CATEGORY_TO_SLUG: Dict[str, str] = {v: k for k, v in CATEGORY_SLUG_MAP.items()}

# Optional category focus to narrow site to 1-2 niches in the future.
# If empty, all FIXED_CATEGORIES are enabled.
# Example: CATEGORY_FOCUS = ["AI & Tech", "Markets"]
CATEGORY_FOCUS: List[str] = []

# Canonical byline for all automated news articles
EDITORIAL_BYLINE: str = "GlobalPulse AI Desk"

# Headline length constraint
HEADLINE_MAX_LENGTH: int = 65

# Meta description length constraints (must be complete sentence)
META_DESC_MIN_LENGTH: int = 140
META_DESC_MAX_LENGTH: int = 155

# Article body word count bounds (allows 80-200 word briefs for short sources)
BODY_WORD_COUNT_MIN: int = 80
BODY_WORD_COUNT_MAX: int = 400

# Strictly banned buzzwords, jargon, unsupported adjectives, and generic filler
BANNED_WORDS: List[str] = [
    "tier-1",
    "neural",
    "dossier",
    "telemetry",
    "high-stakes",
    "landmark",
    "intelligence report",
    "synthesized",
    "decisive tactical adjustments",
    "accelerating operational transition",
    "efficiency dividend",
    "strategic transition",
    "brilliant",
    "crucial",
    "major",
    "dismantling",
    "dominant",
    "tactical overloads",
    "counter-pressing traps",
]

# Editorial intros for each category page (unique, 2 sentences each)
CATEGORY_EDITORIAL_INTROS: Dict[str, str] = {
    "AI & Tech": (
        "Independent reporting and analysis on artificial intelligence, computing architecture, and software breakthroughs. "
        "We track how technical advances reshape global industry without hype or corporate jargon."
    ),
    "Markets": (
        "Objective coverage of international financial markets, sovereign debt, central bank policies, and commodities. "
        "Every dispatch provides plain-English context on asset flows and global economic trends."
    ),
    "World Politics": (
        "Verified dispatches on international diplomacy, elections, defense policy, and global alliances. "
        "Our team presents the facts clearly with balanced context for US and UK readers."
    ),
    "Science": (
        "Fact-based reporting on space exploration, energy transitions, climate research, and scientific discoveries. "
        "We distill peer-reviewed studies and primary announcements into concise, accessible journalism."
    ),
    "Sports": (
        "Essential results, tactical summaries, and championship coverage from leading global sporting competitions. "
        "We focus on confirmed scores, fixture context, and verified player achievements."
    ),
    "Entertainment": (
        "Timely news covering cinema, streaming, television productions, and gaming industry developments. "
        "We deliver accurate dispatches on releases, box office results, and creative talent."
    ),
}

