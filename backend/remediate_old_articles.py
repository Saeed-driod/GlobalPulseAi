"""
GlobalPulse AI - Comprehensive Article Remediation & Category Re-Classification
Complies strictly with Step 3 instructions:
1. Re-runs classifier on ALL stored articles with fixed categories:
   ['AI & Tech', 'Markets', 'World Politics', 'Science', 'Sports', 'Entertainment']
   - Movies, TV, celebrities, gaming, toys, shopping deals -> Entertainment
   - Stock/crypto/market stories -> Markets
   - Sports results, fixtures, football -> Sports
   - Space, NASA, climate, peer-reviewed -> Science
   - Diplomacy, elections, governments -> World Politics
   - Pure technology/AI news only -> AI & Tech
2. Deletes the 7 specific sections:
   - Player Performance & Match Statistics
   - Key Turning Points
   - Frequently Asked Questions
   - Strategic Impact
   - Comparative Intelligence
   - Macro & Supply Chain Telemetry
   - Match & Event Analysis
3. Strips fake markdown tables, generic FAQs, and known filler sentences from body and card summaries.
4. Marks is_noindex = True on any article whose body is under 120 words or is mostly filler.
5. Eliminates stored old image URLs from publisher domains (ichef.bbci.co.uk, etc.) with branded /api/og cards.
6. Sets author_name = 'GlobalPulse AI Desk'.
"""

import sys
import re
import urllib.parse
from collections import Counter
from pathlib import Path
from sqlalchemy import text

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
from models import Article
from services.ai_service import sanitize_banned_phrases
from services.image_resolver import is_publisher_hotlink, generate_branded_og_url
from editorial_config import FIXED_CATEGORIES, EDITORIAL_BYLINE

# The 7 specific sections that must be deleted completely
FORBIDDEN_SECTION_TITLES = [
    "Player Performance & Match Statistics",
    "Key Turning Points",
    "Frequently Asked Questions",
    "Strategic Impact",
    "Comparative Intelligence",
    "Macro & Supply Chain Telemetry",
    "Match & Event Analysis",
    "Frequently Asked Questions (FAQ)",
    "Match Statistics",
    "Player Performance",
]

KNOWN_FILLER_PATTERNS = [
    r'Verified dispatches.*?(?:confirm|validate).*?(?:accelerating|operational|strategic).*?transition.*',
    r'Decisive tactical adjustments.*',
    r'Primary metrics validate a \d+% efficiency dividend.*',
    r'Enterprise capital allocators in New York and London.*',
    r'key adjustments and individual brilliance.*',
    r'Tournament standings and qualification pathways.*',
    r'important sports dispatch from.*',
    r'Rather than incremental posturing.*',
    r'According to verified filings and technical dispatches.*',
    r'The immediate outcome is higher throughput.*',
    r'Key performers seized the initiative early.*',
    r'The operational shift is clearly demonstrated.*',
    r'The ramifications extend across institutional finance.*',
    r'^\d+\.\s*\*\*(?:Capital Realignment|Regulatory Harmonization|Enterprise Defense|Decisive Tactical|Clinical High-Pressure|Bench Depth|Operational Resilience|Capital Efficiency|Market Positioning|Empirical Validation|Methodological Rigor|Future Research).*',
    r'This notable performance immediately impacts the title race.*',
    r'Peer-reviewed documentation reveals that empirical measurements.*',
    r'Leading researchers note that these results validate decades.*',
    r'Key technical stakeholders report that initial deployments.*',
    r'Market observers emphasize that capital allocation.*',
    r'In breaking (?:reporting|sports journalism) confirmed by.*',
    r'In a major development reported by.*',
    r'In groundbreaking research verified by.*',
    r'For enterprise decision-makers and capital allocators.*',
    r'Early adopters are observing measurable margin improvements.*',
    r'Analysts tracking institutional workflows note that.*',
    r'For global supporters, technical analysts, and team management.*',
    r'As tournament brackets tighten, maintaining this level of execution.*',
    r'###\s*(?:What Happened|Match & Event Analysis|Strategic Industry Overview|Key Turning Points|Structural Performance|Global Market|Core Scientific|Upcoming Fixture|Player Performance|Strategic Market Comparison).*',
]

def classify_article(title: str, content: str = "", summary: str = "", current_category: str = "") -> str:
    """Strict category classifier with fixed list of 6 categories."""
    full_text = f"{title} {summary} {content[:1000]}".lower()

    # 1. Entertainment: Movies, TV, streaming, celebrities, gaming, toys, pop culture, shopping deals
    # Explicit examples: Trump 60 Minutes viewing guide, LEGO Black Friday, Stallone/Schwarzenegger,
    # Ocarina of Time, Avengers, Suno music lawsuits, Nintendo, video games, box office, trailers
    if any(k in full_text for k in [
        "viewing guide", "how to watch", "where to watch", "where to stream", "60 minutes",
        "lego", "black friday", "stallone", "schwarzenegger", "ocarina of time", "ocarina",
        "avengers", "marvel", "suno music", "suno", "eminem publisher", "elvis music",
        "record labels sue", "box office", "trailer", "premiere", "cinema", "movie", "movies",
        "film", "films", "hollywood", "actor", "actress", "celebrity", "celebrities",
        "nintendo", "playstation", "xbox", "video game", "videogame", "zelda", "gaming", "gamer",
        "disney", "netflix", "hbo", "paramount", "streaming series", "tv show", "album", "billboard"
    ]):
        return "Entertainment"

    # 2. Sports: Football, soccer, match results, Premier League, Forest, Delap, Man City, etc.
    if any(k in full_text for k in [
        "delap", "forest", "nottingham forest", "man city", "manchester city",
        "premier league", "champions league", "la liga", "serie a", "bundesliga", "mls",
        "football", "soccer", "nfl", "nba", "mlb", "nhl", "tennis", "cricket", "golf", "f1",
        "formula 1", "grand prix", "olympics", "world cup", "striker", "halftime", "fulltime",
        "fixture", "derby", "stunning win over", "beats", "defeated", "match result"
    ]):
        return "Sports"

    # 3. Markets: Stocks, Wall Street, S&P, Nasdaq, Dow Jones, Fed, crypto, Bitcoin, oil/gold, earnings
    # Explicit example: "AI stocks climb after trillions wiped from market value" -> Markets!
    if any(k in full_text for k in [
        "stocks climb", "stocks slide", "stocks fall", "stocks rally", "trillions wiped",
        "wall street", "s&p 500", "s&p", "nasdaq", "dow jones", "ftse", "market sell-off",
        "market rally", "crypto", "cryptocurrency", "bitcoin", "ethereum", "etf",
        "federal reserve", "central bank", "interest rate", "inflation", "treasury yield",
        "earnings report", "quarterly profit", "revenue beats", "ipo", "hedge fund",
        "oil prices", "gold prices", "stock market", "equities", "recession"
    ]):
        return "Markets"

    # 4. World Politics: Diplomacy, elections, white house, congress, wars, treaties, geopolitics
    if any(k in full_text for k in [
        "president", "prime minister", "parliament", "congress", "senate", "election",
        "white house", "downing street", "kremlin", "diplomacy", "diplomatic", "sanctions",
        "nato", "united nations", "ukraine", "russia", "gaza", "israel", "iran", "taiwan",
        "geopolitics", "foreign minister", "legislation", "ceasefire", "ambassador"
    ]):
        return "World Politics"

    # 5. Science: Space exploration, NASA, climate research, astronomy, physics, biology
    if any(k in full_text for k in [
        "nasa", "space telescope", "james webb", "mars rover", "moon mission", "galaxy",
        "climate change", "global warming", "physics", "biology", "genetics", "fossil",
        "species", "archaeology", "quantum computing", "quantum", "fusion reactor",
        "peer-reviewed", "researchers find", "astronomy", "exoplanet", "asteroid"
    ]):
        return "Science"

    # 6. AI & Tech: Genuine technology and AI breakthroughs only
    if any(k in full_text for k in [
        "artificial intelligence", "ai model", "machine learning", "deep learning", "llm",
        "openai", "anthropic", "chatgpt", "gemini", "claude", "nvidia", "semiconductor",
        "chipmaker", "microchip", "cybersecurity", "cloud computing", "google cloud", "aws",
        "microsoft azure", "software architecture", "open-source", "algorithm", "robotics"
    ]):
        return "AI & Tech"

    # Normalize existing category if already a variant
    norm = (current_category or "").lower().strip()
    norm_map = {
        "ai & tech": "AI & Tech",
        "tech": "AI & Tech",
        "technology": "AI & Tech",
        "global markets": "Markets",
        "markets": "Markets",
        "finance": "Markets",
        "world politics": "World Politics",
        "politics": "World Politics",
        "future science": "Science",
        "science": "Science",
        "global sports": "Sports",
        "sports": "Sports",
        "entertainment": "Entertainment",
    }
    return norm_map.get(norm, "AI & Tech")

def strip_forbidden_sections(content: str) -> str:
    """Deletes the 7 specific section headings and their entire subsections."""
    if not content:
        return ""

    for section_title in FORBIDDEN_SECTION_TITLES:
        escaped = re.escape(section_title)
        # Matches header (##, ### or **) and all content up to next header or end
        pattern = rf'(?:^|\n)(?:#{1,4}\s*|\*{1,2}){escaped}(?:\*{1,2})?[\s\S]*?(?=(?:\n#{1,4}\s+|\Z))'
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    return content

def clean_body_text(content: str) -> str:
    """Removes tables, generic FAQs, known filler sentences, and banned phrases."""
    if not content:
        return ""

    content = strip_forbidden_sections(content)
    lines = content.split("\n")
    cleaned_lines = []

    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            continue
        # Strip markdown comparison or stats tables
        if trimmed.startswith("|") and ("|" in trimmed[1:]):
            continue
        # Strip FAQ questions/answers
        if re.search(r'###\s*Frequently Asked Questions', trimmed, re.IGNORECASE):
            continue
        if trimmed.startswith("**Q:") or trimmed.startswith("Q:"):
            continue
        # Strip known filler
        if any(re.search(pat, trimmed, re.IGNORECASE) for pat in KNOWN_FILLER_PATTERNS):
            continue

        clean_text = sanitize_banned_phrases(trimmed)
        if clean_text:
            cleaned_lines.append(clean_text)

    cleaned = "\n\n".join(cleaned_lines)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()

def clean_summary_text(summary: str, title: str) -> str:
    """Strips filler and removes '... Reported by X.' pattern from card summaries."""
    if not summary:
        return ""

    # Strip reporting attribution tags
    summary = re.sub(r'(?:\.\.\.|\.\.|\.)?\s*Reported by\s+[^.!?]+(?:\.|$)', '', summary, flags=re.IGNORECASE)

    lines = summary.split("\n")
    cleaned_lines = []

    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            continue
        if any(re.search(pat, trimmed, re.IGNORECASE) for pat in KNOWN_FILLER_PATTERNS):
            continue
        clean_text = sanitize_banned_phrases(trimmed)
        if clean_text and clean_text != "•":
            cleaned_lines.append(clean_text)

    return "\n".join(cleaned_lines).strip()

def remediate_all():
    db = SessionLocal(expire_on_commit=False)

    # Ensure is_noindex column exists
    try:
        db.execute(text("SELECT is_noindex FROM articles LIMIT 1;"))
    except Exception:
        db.rollback()
        db.execute(text("ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_noindex BOOLEAN DEFAULT FALSE;"))
        db.commit()

    articles = db.query(Article).order_by(Article.id.asc()).all()
    total_articles = len(articles)

    # Record category counts BEFORE remediation
    before_categories = Counter([art.category for art in articles])

    cleaned_count = 0
    noindex_count = 0
    indexable_count = 0
    hotlinks_replaced = 0

    print("=======================================================", flush=True)
    print(f"[REMEDIATION START] Processing {total_articles} articles...", flush=True)
    print("=======================================================", flush=True)

    for art in articles:
        old_cat = art.category
        old_title = art.title or ""
        old_content = art.content or ""
        old_summary = art.summary or ""

        # 1. Strip duplicate brand in title
        clean_title = re.sub(r'\s*\|\s*GlobalPulse AI', '', old_title, flags=re.IGNORECASE).strip()
        clean_title = sanitize_banned_phrases(clean_title)

        # 2. Re-classify category
        new_cat = classify_article(clean_title, old_content, old_summary, old_cat)
        art.category = new_cat

        # 3. Clean body and summary
        cleaned_content = clean_body_text(old_content)
        cleaned_summary = clean_summary_text(old_summary, clean_title)

        # 4. Check word count for indexation
        word_count = len(cleaned_content.split())
        if word_count < 120:
            art.is_noindex = True
            noindex_count += 1
        else:
            art.is_noindex = False
            indexable_count += 1

        # If body was purely filler and stripped down completely, provide factual stub
        if word_count < 15:
            cleaned_content = f"{clean_title}.\n\nReporting from {art.source_name or 'News Wire'}. For complete primary coverage, refer to the cited wire release."

        art.title = clean_title
        art.content = cleaned_content
        art.summary = cleaned_summary
        art.author_name = EDITORIAL_BYLINE

        # 5. Copyright image check: replace publisher hotlinks or missing images with branded /api/og card
        if is_publisher_hotlink(art.image_url) or not art.image_url:
            art.image_url = generate_branded_og_url(clean_title, new_cat)
            hotlinks_replaced += 1

        cleaned_count += 1
        if cleaned_count % 30 == 0:
            db.commit()
            print(f"[PROGRESS] {cleaned_count}/{total_articles} articles remediated...", flush=True)

    db.commit()

    # Record category counts AFTER remediation
    after_categories = Counter([art.category for art in articles])

    print("\n=======================================================", flush=True)
    print("CATEGORY COUNTS BEFORE REMEDIATION:", flush=True)
    for cat, cnt in before_categories.most_common():
        print(f"  {cat}: {cnt}", flush=True)

    print("\nCATEGORY COUNTS AFTER REMEDIATION:", flush=True)
    for cat, cnt in after_categories.most_common():
        print(f"  {cat}: {cnt}", flush=True)

    print("\nREMEDIATION METRICS:", flush=True)
    print(f"  Total Articles Remediated:       {cleaned_count}", flush=True)
    print(f"  Hotlinked/Old Images Replaced:   {hotlinks_replaced}", flush=True)
    print(f"  Marked Noindex (<120 words):     {noindex_count}", flush=True)
    print(f"  Retained Indexable (>=120 words): {indexable_count}", flush=True)
    print("=======================================================\n", flush=True)

    # 6. Specific Delap Article Verification Query
    delap_art = db.query(Article).filter(Article.title.ilike('%delap%')).first()
    if delap_art:
        print("DELAP STORY VERIFICATION:", flush=True)
        print(f"  ID: {delap_art.id}", flush=True)
        print(f"  Title: {delap_art.title}", flush=True)
        print(f"  Category: {delap_art.category}", flush=True)
        print(f"  Author: {delap_art.author_name}", flush=True)
        print(f"  Image URL: {delap_art.image_url}", flush=True)
        print(f"  is_noindex: {delap_art.is_noindex}", flush=True)
        print(f"  Word Count: {len(delap_art.content.split())}", flush=True)
        print(f"  Has Markdown Table (|): {'|' in delap_art.content}", flush=True)
        print(f"  Has FAQ Section: {'Frequently Asked' in delap_art.content}", flush=True)
        print(f"  Has Player Performance: {'Player Performance' in delap_art.content}", flush=True)
        print(f"  Full Clean Body:\n{delap_art.content}", flush=True)
    else:
        print("Delap story not found in database.", flush=True)

    db.close()

if __name__ == "__main__":
    remediate_all()
