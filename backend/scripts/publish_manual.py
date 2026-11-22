"""
GlobalPulse AI - Manual Article Publisher / Updater
Safely publishes or updates handwritten articles on GlobalPulse with idempotent operations.
Usage:
  python backend/scripts/publish_manual.py --dry-run   (Default: validates candidates & state without modifying DB)
  python backend/scripts/publish_manual.py --apply     (Applies updates/inserts to DB and pings IndexNow)
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List

# Auto re-exec into backend/venv if executed with system python
_venv_py_linux = Path(__file__).resolve().parent.parent / "venv" / "bin" / "python"
_venv_py_win = Path(__file__).resolve().parent.parent / "venv" / "Scripts" / "python.exe"
_venv_py = _venv_py_linux if _venv_py_linux.exists() else (_venv_py_win if _venv_py_win.exists() else None)

if _venv_py and Path(sys.executable).resolve() != _venv_py.resolve():
    os.execv(str(_venv_py), [str(_venv_py)] + sys.argv)

# Safe Unicode output on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure backend directory and root are in sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

for p in (ROOT_DIR, BACKEND_DIR, SCRIPT_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

try:
    from database import SessionLocal
    from models import Article, ArticleStatus
    from services.indexing_service import notify_search_engines_new_article
except ImportError:
    from backend.database import SessionLocal
    from backend.models import Article, ArticleStatus
    from backend.services.indexing_service import notify_search_engines_new_article


MANUAL_ARTICLES: List[Dict[str, Any]] = [
    {
        "slug": "black-friday-2026-gaming-deals-what-is-cheaper",
        "title": "Black Friday 2026 Gaming Deals: What Is Actually Cheaper",
        "category": "AI & Tech",
        "meta_description": (
            "Black Friday is 27 November. Early US gaming deals on DualSense, Switch 2 and more are live, "
            "but GTA 6 is not discounted. Here is what is listed and what to check."
        ),
        "summary": (
            "• Black Friday 2026 falls on 27 November with early US deals already live across PlayStation, Xbox and Nintendo accessories.\n"
            "• Nintendo Switch 2 Mario Kart World bundles and DualSense controllers see notable early discounts, while GTA 6 has no game-level discounts.\n"
            "• Shoppers should compare retailers, check price history, and confirm seller details before purchasing amid fluctuating stock."
        ),
        "content": """Black Friday 2026 falls on Friday 27 November, and early gaming deals are already live in the US. Here is what GamesRadar and PC Guide currently list, what is not discounted, and what to check before you buy. All prices below are US dollars from US retailers, so UK and other regions will differ.

## Key dates

GamesRadar says the main event is 27 November, and that Nintendo's Black Friday deals start on Sunday 22 November. PC Guide lists Cyber Monday as 30 November. GamesRadar's live blog was last updated on 20 November, and prices can change quickly.

## PlayStation and Xbox deals listed

- **DualSense controller:** $74.99 down to $54.99 at Amazon. Some colours, including Cobalt Blue and Techno Red, were out of stock at the time, and the GTA 6 special edition is excluded.
- **DualSense Edge:** listed at $169, with no retailer stated.
- **Resonance: A Plague Tale Legacy (PS5):** $59.99 down to $39.99 at Amazon.
- **Nacon Revolution X Unlimited (Xbox):** $199.99 down to $149.99 at Amazon.
- **PlayStation Access Controller:** $59.99, down from $89.99 at Amazon, ending 1 December, according to PC Guide.

## Nintendo Switch 2 deals

GamesRadar says the Mario Kart World bundle is $549.99 at Amazon now, and is expected to be $499.99 from Sunday, with Mario Kart World included and three months of Switch Online. Six physical games are expected to drop by $20 on Sunday at Amazon, including Donkey Kong Bananza at $49.99 and Metroid Prime 4 Beyond at $39.99. These are listed as upcoming, not confirmed live.

## Is GTA 6 on sale?

Not on the pages we checked. GamesRadar mentions no discount on the game, and PC Guide says not to expect big savings on the game itself in its first weeks. PC Guide says savings are more likely on console bundles, console discounts, or retailer gift cards and store credit. Its GTA 6 deals section lists only accessories and other games.

## Other retailer offers

GamesRadar lists Best Buy at up to 60% off PlayStation items, Walmart accessories from $4.99, Target at up to 30% off accessories, Woot at up to 29% off Switch games, and PS Direct at up to $30 off controllers. Some Amazon offers are for Prime members only.

## Before you buy

- **Check stock and price history.** Several discounted items sold out or went back up within hours, and GamesRadar notes a game price rose about an hour after a brief drop.
- **Compare retailers.** Some offer coupons, gift cards or bonus subscriptions.
- **On Walmart,** GamesRadar suggests filtering to items sold by Walmart itself to avoid unreliable third-party sellers.
- **Dates conflict.** PC Guide shows different "last checked" dates on the same page, so confirm the price at checkout.

## What we do not know yet

- Which deals will be best on 27 November. Retailers often hold stock back and rotate offers.
- UK prices. The sources we checked list US dollars only.

Sources: GamesRadar, early Black Friday deals for gamers live blog (updated 20 November 2026); PC Guide, GTA 6 Black Friday deals 2026 (updated 17 November 2026).""",
    },
    {
        "slug": "anthropic-record-ipo-81-billion-first-day-nasdaq",
        "title": "Anthropic's Record $81.3B IPO: What Happened on Day One",
        "category": "AI & Tech",
        "meta_description": (
            "Anthropic raised a record $81.3B in its Nasdaq IPO on 19 November. "
            "Offer price, first-day move, valuation figures, the risks analysts flag, and what is unclear."
        ),
        "summary": (
            "• Anthropic raised a record $81.3B in its Nasdaq debut under ticker ANT, selling 980 million shares at $83 each.\n"
            "• Shares surged 34% at open to $111.50 before settling 17% higher at $97.17 amid broader market declines.\n"
            "• Reported risks include lack of profitability, $6.2B in debt, heavy long-term infrastructure commitments, and proposed bipartisan AI disclosure legislation."
        ),
        "content": """Anthropic, the AI company behind the Claude models, began trading on the Nasdaq on Thursday 19 November 2026 under the ticker ANT, after raising $81.3 billion in what is described as the largest initial public offering on record. Here is what the main reports say about the numbers, the first-day trading and the risks, and what is still unclear.

Disclosure: this article was drafted with the help of Claude, an AI model made by Anthropic, the company it covers. Every figure below comes from the cited sources.

## The offering

According to CBS News, Anthropic sold 980 million Class A shares at $83 each, above an original range of $70 to $78 that was raised amid strong demand. The $81.3 billion raised is ahead of the roughly $75 billion SpaceX raised in its June IPO. CBS reports that about 7.4% of shares are available for public trading, per Renaissance Capital.

CBS also reports that Anthropic plans to raise a further $26 billion from companies including AMD, Broadcom, Google, Microsoft and Nvidia, which would bring total fundraising to about $107 billion.

## First day of trading

- **Open:** $111.50, about 34% above the offer price.
- **Intraday high:** $114.99, which valued the company at more than $2 trillion at the peak, per CBS.
- **Close:** $97.17, up 17% from the offer price.

The debut came on a weak day for the broader market. CBS reports the Nasdaq fell about 2.3%, the Dow more than 1,100 points and the S&P 500 about 2%.

## Why the valuation figures differ

Different outlets quote different valuations because they use different share prices. Seoul Economic Daily reports about $1.5 trillion at the offer price, about $1.75 trillion at the first-day close, and up to about $2.01 trillion at the intraday peak. The same report says Morningstar analyst Malik Ahmed Khan put fair value at $92 per share, about 5% below the close.

## What analysts and experts said

Dan Ives of Yorkville Ives & Co. called the IPO an "A-plus success," according to CBS. Jay Ritter of the University of Florida said that "both the jump from the offer price and the high volatility are not surprising." Sam Grelck of Truist Advisory Services said the IPO should not be seen as a verdict on AI, but that the reception could show investor appetite for the AI theme.

## The risks reported

CBS lists several risks:

- Anthropic has not yet turned a profit, and the article gives no revenue figures.
- It had $6.2 billion in debt as of 30 September and commitments of nearly $1 trillion on chips and AI infrastructure through 2045.
- A Truist study of 32 of the largest IPOs found more than half of them saw shares fall at least 50% at some point in their first year.
- Wider concerns include AI company debt and returns, possible political scrutiny of the AI boom, and the departure of Jensen Huang from Nvidia.

The Neuron's 20 November roundup also reports that four US senators introduced bipartisan legislation requiring public companies to disclose more AI-related information, prompted in part by the IPO. We did not verify this with a primary source.

## What we do not know yet

- How ANT will trade in the coming weeks. Early trading was volatile.
- Revenue and profit figures, which the CBS article does not give.
- Whether the proposed AI disclosure bill will advance.

This article is for information only and is not investment advice.

Sources: CBS News, Anthropic shares gain 17% on first day of trading (updated 19 November 2026); Seoul Economic Daily, Anthropic debuts at $1.75 trillion (21 November 2026); Forbes Middle East, Anthropic IPO raises record $81.3B (headline and opening price only); The Neuron, Everything that happened in AI today (20 November 2026).""",
    },
    {
        "slug": "gta-6-uk-prices-editions-where-to-buy",
        "title": "GTA 6 in the UK: Prices, Editions and Where to Buy",
        "category": "Entertainment",
        "meta_description": (
            "GTA 6 is out now in the UK on PS5 and Xbox. Prices, editions, what we found on Asda and Tesco, "
            "reported retailer deals and what to check before you buy."
        ),
        "summary": (
            "• GTA 6 is available in the UK for £69.99 (Standard Edition code-in-a-box) and £89.99 (Ultimate Edition digital).\n"
            "• Asda offered a £59.97 deal via loyalty coupon (now expired), while Tesco listings remain unconfirmed.\n"
            "• Codes are region-locked on PlayStation, physical copies lack discs, and early launch access is single-player only."
        ),
        "content": """Grand Theft Auto VI launched on 19 November 2026 on PlayStation 5 and Xbox Series X|S, according to Rockstar Games. If you are in the UK and have not bought it yet, this guide covers the confirmed price, the two editions, what we could and could not confirm about Asda and Tesco, and deals reported by UK shoppers.

Updated 22 November 2026 with Asda and retailer-deal details.

## When did GTA 6 unlock in the UK?

Rockstar listed 19 November as the launch date and said pre-load began on 10 November. PC Gamer reported that the rollout is rolling rather than simultaneous: pre-loaded copies unlock at midnight local time on 19 November in each region, which means players in New Zealand get in first. In the UK, that points to the start of 19 November, though Rockstar has not published an exact unlock time in the pages we checked.

## GTA 6 prices and editions in the UK

Retailer trackers from TechRadar and GamesRadar list two editions:

- **Standard Edition:** £69.99 in the UK ($79.99 in the US). The physical version is a code in a box, with no disc inside, according to TechRadar and the Rockstar Store listing.
- **Ultimate Edition:** £89.99 in the UK ($99.99 in the US). GamesRadar says it is sold through the PlayStation and Xbox digital stores only, and TechRadar says a physical Ultimate box had not been spotted.

Both trackers were last updated before launch (TechRadar in June, GamesRadar in August), so treat the figures as the recommended prices and confirm the current price at checkout.

## Does Asda sell GTA 6?

Partly confirmed. A deal posted on HotUKDeals lists "Grand Theft Auto VI" at **£59.97** at Asda for the PS5 and Xbox Series X|S code-in-a-box versions, using a coupon in the Asda Rewards app. The listing says it was in-store only and for "selected accounts," and the page now states that the deal is no longer available.

A search also returns an Asda George product page titled "Grand Theft Auto VI - PS5 (Code in Box)". We could not load that page, so we cannot confirm its current price or stock. Check Asda directly before travelling to a store.

## Does Tesco sell GTA 6?

We could not confirm it. We searched for a Tesco listing and found no Tesco price or stock page in the results, so we are not stating one. Check the Tesco website or app, and compare it with the retailers below.

## Other UK retailers and deals

GamesRadar and TechRadar list Amazon UK, Argos, GAME, Currys, Very, ShopTo, John Lewis, Smyths Toys and the PlayStation Store for the Standard Edition, mostly at £69.99. Amazon UK was shown at £67.99 in the August update.

HotUKDeals also lists these offers, which may have changed or ended:

- **AO:** the PS5 code-in-a-box version at £64 for AO members, with free delivery.
- **ShopTo:** the Standard Edition plus an Ultimate upgrade at £81.80 using ShopTo credit, which the listing compares with paying £89.99 directly through the PlayStation Store.

These come from deal listings, not from the retailers' own pages, so confirm the price at checkout.

## Pre-order bonuses

The Rockstar Store said orders placed before 20 November included the Vintage Vice City Pack, "while supplies last". That window has now closed, so check with the retailer whether it still applies to your order. TechRadar and GamesRadar add that digital pre-orders on the PlayStation Store or Xbox included one free month of GTA+.

## Bundles

GamesRadar and TechRadar listed EE bundles of a PS5 Slim with GTA 6 at around £588 to £603 and a PS5 Pro with GTA 6 at around £808 to £843 in their trackers, with prices moving between updates. Check the current price, as bundle deals change often.

## Before you buy

- **PlayStation Store codes are region-locked.** GamesRadar notes that a code bought in one region only works there, while Xbox codes are not restricted in the same way.
- **There is no PC version yet.** PC Gamer says Rockstar has not announced a PC date.
- **Launch is single-player.** PC Gamer reports that the online mode is not part of the launch.
- **It is an adult game.** The Rockstar Store lists an ESRB Mature rating.
- **Check your boxed code.** Dexerto reported that some buyers received boxes with a missing or already-used code. If yours does not work, contact the retailer first.

## Quick answers

**Is GTA 6 on PS5 and Xbox?** Yes, Rockstar names PS5 and Xbox Series X|S.

**What is the cheapest way to buy it in the UK?** The listed price is £69.99 for the Standard Edition. Deal listings have shown lower prices, such as £59.97 at Asda with a coupon (in store, selected accounts, now ended) and £64 at AO for members. Check prices at checkout.

**Does Tesco have it?** We could not confirm a Tesco listing.

Sources: Rockstar Games (rockstargames.com newswire and store.rockstargames.com), PC Gamer live launch coverage (18 November 2026), TechRadar GTA 6 pre-order tracker (updated 27 June 2026), GamesRadar where to pre-order GTA 6 (updated 24 August 2026), HotUKDeals GTA VI deal pages (Asda, AO, ShopTo listings), Dexerto (15 November 2026).""",
    },
]


def publish_or_update_article(db, item: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
    slug = item["slug"]
    title = item["title"]
    category = item["category"]
    meta_desc = item["meta_description"]
    summary = item["summary"]
    content = item["content"]

    existing = db.query(Article).filter(Article.slug == slug).first()

    if existing:
        action = "updated"
        article_id = existing.id
        if not dry_run:
            existing.title = title
            existing.category = category
            existing.content = content
            existing.summary = summary
            existing.status = ArticleStatus.PUBLISHED.value
            existing.is_noindex = False
            if hasattr(existing, "meta_description"):
                setattr(existing, "meta_description", meta_desc)
            if hasattr(existing, "updated_at"):
                setattr(existing, "updated_at", datetime.now(timezone.utc))
            db.commit()
            db.refresh(existing)
    else:
        action = "created"
        article_id = None
        if not dry_run:
            kwargs = {
                "title": title,
                "slug": slug,
                "category": category,
                "summary": summary,
                "content": content,
                "author_name": "GlobalPulse AI Desk",
                "source_name": "GlobalPulse AI Desk",
                "source_url": None,
                "image_url": None,
                "status": ArticleStatus.PUBLISHED.value,
                "is_noindex": False,
                "published_at": datetime.now(timezone.utc),
                "views": 0,
            }
            if hasattr(Article, "meta_description"):
                kwargs["meta_description"] = meta_desc
            if hasattr(Article, "video_status"):
                kwargs["video_status"] = "IDLE"

            new_art = Article(**kwargs)
            db.add(new_art)
            db.commit()
            db.refresh(new_art)
            article_id = new_art.id

    # Call IndexNow if applied
    if not dry_run:
        try:
            notify_search_engines_new_article(slug)
        except Exception as e:
            print(f"[IndexNow Warning] Could not notify search engines for {slug}: {e}")

    return {
        "slug": slug,
        "action": action,
        "article_id": article_id,
        "url": f"https://theglobalpulseai.com/news/{slug}",
        "title": title,
        "category": category,
        "word_count": len(content.split()),
    }


def main():
    parser = argparse.ArgumentParser(description="Publish or update manual articles")
    parser.add_argument(
        "--apply",
        dest="dry_run",
        action="store_false",
        help="Apply changes to DB and notify IndexNow",
    )
    parser.add_argument(
        "--dry-run",
        dest="dry_run",
        action="store_true",
        default=True,
        help="Validate without modifying database or pinging IndexNow (default)",
    )
    parser.add_argument(
        "--slug",
        dest="slug",
        type=str,
        default=None,
        help="Target only one specific slug from predefined list",
    )
    args = parser.parse_args()

    mode = "DRY-RUN" if args.dry_run else "APPLY (LIVE DB)"
    print("=" * 65)
    print(f"  GLOBALPULSE AI - MANUAL ARTICLE PUBLISHER [{mode}]")
    print("=" * 65)

    db = SessionLocal()
    try:
        targets = MANUAL_ARTICLES
        if args.slug:
            targets = [a for a in MANUAL_ARTICLES if a["slug"] == args.slug]
            if not targets:
                print(f"[Error] Slug '{args.slug}' not found in predefined articles.")
                sys.exit(1)

        results = []
        for item in targets:
            res = publish_or_update_article(db, item, dry_run=args.dry_run)
            results.append(res)
            print(f"\n[{res['action'].upper()}] {res['slug']}")
            print(f"  Title     : {res['title']}")
            print(f"  Category  : {res['category']}")
            print(f"  Word Count: {res['word_count']}")
            print(f"  URL       : {res['url']}")

        print("\n" + "=" * 65)
        print("SUMMARY:")
        for r in results:
            print(f"{r['url']} -> {r['action']}")
        print("=" * 65)

    finally:
        db.close()


if __name__ == "__main__":
    main()
