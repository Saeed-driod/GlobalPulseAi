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
        "slug": "sonos-black-friday-2026-best-deals-arc-ultra-beam-ace",
        "title": "Sonos Black Friday 2026: Best Deals on Arc Ultra, Beam, Ace",
        "category": "AI & Tech",
        "meta_description": (
            "Sonos Black Friday 2026 deals: Arc Ultra $849, Beam $339, Ace $229 in the US, plus UK prices at Currys. What is discounted, until when, and what to check."
        ),
        "summary": (
            "• Sonos is offering up to 25% off select soundbars, speakers, headphones and subwoofers through 30 November 2026, with US deals including Arc Ultra at $849 and Beam (Gen 2) at $339.\n"
            "• Tom's Guide highlights the Sonos Ace headphones at $229 ($120 off) as their lowest price ever, alongside multi-room bundles like the Ultimate Immersive Set at $2,199.\n"
            "• UK shoppers can find Currys discounts including Arc Ultra at £799 (£200 off), Beam (Gen 2) at £339 (£110 off) and Sub Mini at £339 (£90 off)."
        ),
        "image_url": "https://theglobalpulseai.com/articles/sonos-black-friday.png",
        "content": """Black Friday is on 27 November, and Sonos has already cut prices on its soundbars, speakers and headphones. Here are the prices reported by MacRumors and Tom's Guide on 19 and 25 November, with US deals first and UK deals after. Prices and stock can change quickly, so confirm the figure at checkout.

## Sonos Black Friday 2026: the short version

MacRumors reports that Sonos is offering up to 25% off select products through 30 November. The listed discounts cover speakers, soundbars, headphones and subwoofers, with several multi-room bundles included.

## US deals

These sale prices appear in MacRumors' list of Sonos.com offers. The regular prices are our arithmetic, sale price plus the listed discount, and Tom's Guide's Amazon figures mostly match them:

| Product | Sale price | Discount |
|---|---|---|
| Arc Ultra (soundbar) | $849 | $250 off |
| Beam (Gen 2) | $339 | $160 off |
| Ray (soundbar) | $169 | $50 off |
| Sonos Ace (headphones) | $229 | $120 off |
| Move 2 | $399 | $100 off |
| Era 100 | $179 | $40 off |
| Roam 2 | $139 | $40 off |
| Sub Mini | $399 | $100 off |
| Sub 4 | $719 | $180 off |

MacRumors also lists bundles, such as the Immersive Set with Beam at $1,096 ($340 off) and the Ultimate Immersive Set with Arc Ultra at $2,199 ($797 off).

Tom's Guide labels the Sonos Ace at $229 as its lowest price ever. It says the Era 100 at $179 is not the lowest price it has seen.

## UK deals

Tom's Guide lists these UK offers at Currys, with the regular price shown in brackets:

- **Arc Ultra:** £799 (was £999), £200 off
- **Beam (Gen 2):** £339 (was £449), £110 off
- **Ray:** £169 (was £199), £30 off
- **Roam 2:** £139 (was £179), £40 off
- **Sub Mini:** £339 (was £429), £90 off

## Which Sonos product should you look at?

- **Home cinema:** The Arc Ultra and Beam (Gen 2) are the soundbars with the biggest cuts in dollars. The Ray is the cheaper option.
- **Music in a room:** The Era 100 and Move 2 are the speaker deals in the lists above.
- **Headphones:** Tom's Guide calls the Ace's $229 price its lowest ever.

## Before you buy

- **Check the price at checkout.** Tom's Guide shows two different prices for the Ace, the Beam Gen 2 and the Sub Mini in different sections of the same page, so the price depends on the version and retailer.
- **Compare retailers.** The same Sonos product can be priced differently on Sonos.com and Amazon in the US and at Currys in the UK.
- **Check the end date.** MacRumors gives 30 November for the Sonos offers. Tom's Guide gives no end dates for its listings.
- **Buy from an authorised seller** if you want the manufacturer's warranty.

## What we do not know yet

- Whether any price will drop further on 27 November or Cyber Monday.
- Sonos UK prices on Sonos.com. The sources we checked list UK prices at Currys only.

This article is for information only and is not a recommendation to buy.

Sources: MacRumors, Sonos Black Friday sale (19 November 2026); Tom's Guide, best Sonos Black Friday deals (25 November 2026).""",
    },
    {
        "slug": "nvidia-reinstates-jensen-huang-ceo-stock-jumps-31-percent",
        "title": "Nvidia Reinstates Jensen Huang as CEO; Stock Jumps 31%",
        "category": "AI & Tech",
        "meta_description": (
            "Nvidia's board reinstated Jensen Huang as CEO on 23 November, six days after saying it would not. Shares rose about 31%. What changed and what is unclear."
        ),
        "summary": (
            "• Nvidia reinstated Jensen Huang as president, CEO and board member on 23 November 2026 after a unanimous board vote, reversing its 17 November stance.\n"
            "• Nvidia shares jumped about 31.5% to $165.05 on 23 November, lifting the Nasdaq by 6.5% and the S&P 500 by 4.7%, before cooling more than 5% on 24 November.\n"
            "• An independent board committee is investigating reports of a foreign intelligence effort targeting Huang, while Nvidia formed a National Security and Export Control Committee and continues cooperating with ongoing inquiries."
        ),
        "image_url": "https://theglobalpulseai.com/articles/nvidia-huang-returns.png",
        "content": """Nvidia announced on Monday 23 November 2026 that Jensen Huang has been reinstated as president, chief executive officer and a member of the board, effective immediately. The move reverses the position the chairman gave on 17 November, and Nvidia shares rose about 31% that day. Here is what Nvidia said, how the market and analysts reacted, and what remains unclear.

## What Nvidia announced

According to Nvidia's filing with the US Securities and Exchange Commission, the board voted unanimously to reinstate Huang after discussions with him, saying it was satisfied with his candor and ability to lead. The board also said it received input from senior US government levels and concluded that the reinstatement poses no national security risk.

Other points from the release:

- **Board chair:** Harvey C. Jones, who remains chair, said: "The Board believes Jensen is the right person to lead NVIDIA."
- **Colette Kress:** The interim CEO continues as chief financial officer, and the release thanks her for her service.
- **Huang's statement:** He said he takes the role "with the greatest humility and renewed commitment."
- **Investigation:** A committee of independent directors is investigating reports that Huang was the target of a foreign intelligence effort. Huang says he supports the probe and will cooperate. Nvidia has not published further details.
- **New oversight:** A National Security and Export Control Committee, made up only of independent directors, will oversee trade compliance and national security risks. Nvidia is also searching for a Chief Compliance Officer.
- **Investigations:** Nvidia says it will keep cooperating with ongoing government investigations and inquiries.

## How it got here

In a filing dated 12 November, Nvidia said Huang had resigned as CEO and board member, and named Kress interim CEO. On 17 November, at the start of Nvidia's earnings call, chairman Harvey Jones said the board "unanimously accepted his resignation and does not intend to reinstate Jensen as CEO," according to the South China Morning Post. Six days later the board reversed course. Yahoo Finance reported that President Trump had publicly urged the board to reinstate Huang the day before the announcement. We did not see the original comments.

## The market reaction

Nvidia shares closed up about 31.5% at $165.05 on 23 November, according to a market recap by US Brief that cites Yahoo Finance and CNBC. The recap calls it Nvidia's biggest one-day gain since May 2003. The Nasdaq Composite rose about 6.5%, the S&P 500 about 4.7% and the Dow about 3%, and the Nasdaq and S&P 500 had their biggest daily gains since April 2025.

Yahoo Finance reported that Nvidia had fallen for six straight days before the announcement, and that other AI-linked stocks rose as well, including TSMC, Arm and Micron. CNBC reported on 24 November that Nvidia shares fell more than 5% as the rally cooled. We could not open the full CNBC article.

## What analysts said

According to Yahoo Finance, several analysts reacted to the news:

- **Bernstein** upgraded Nvidia to Outperform from Neutral with a $200 price target, 11 days after downgrading it. Analyst Stacy Rasgon said the ongoing investigations may limit the stock's valuation for now. The team called the board's on-and-off response "clown-like."
- **Citi's Atif Malik** raised his target to $240 and said the reinstatement "removes the key overhang created by the CEO transition."
- **KeyBank's John Vinh** called it a "significantly positive development" but is waiting for more detail on the board investigation and an SEC accounting inquiry.
- **Stifel's Ruben Roy** said Huang's return removes key-person risk, but the investigations could still weigh on the stock.

## What we do not know yet

- What the independent committee's investigation will find, and when.
- Whether the SEC accounting inquiry mentioned by analysts leads to any action.
- How Nvidia shares will trade in the coming weeks. They moved sharply in both directions within days.

This article is for information only and is not investment advice.

Sources: NVIDIA Form 8-K and press release (23 November 2026, sec.gov); South China Morning Post (17 November 2026); Yahoo Finance, "Nvidia soars as board reinstates Jensen Huang" and "Wall Street analysts cheer Jensen Huang's return" (23 November 2026); US Brief market recap (23 November 2026); CNBC headline (24 November 2026).""",
    },
    {
        "slug": "robert-pattinson-new-james-bond-what-we-know",
        "title": "Robert Pattinson Is the New James Bond: What We Know",
        "category": "Entertainment",
        "meta_description": (
            "Robert Pattinson was named the new 007 on 16 November. Director, writer, release timing and what is still unconfirmed, including who will play M."
        ),
        "summary": (
            "• Amazon MGM Studios confirmed Robert Pattinson as James Bond on 16 November 2026, with Denis Villeneuve directing and Steven Knight writing the script.\n"
            "• No release date has been confirmed, though reports point to a 2028 release with filming expected to start in 2027.\n"
            "• No other cast has been announced; reports of other actors in contention and who will play M remain unconfirmed."
        ),
        "image_url": "https://theglobalpulseai.com/articles/bond-new-007.png",
        "content": """Robert Pattinson is the next James Bond. Amazon MGM Studios announced the casting on 16 November 2026, ending years of speculation about who would succeed Daniel Craig as 007. Here is what has been confirmed, what has only been reported, and what nobody has said yet.

## Who is the new James Bond?

Amazon MGM Studios confirmed that Pattinson will play James Bond in its next 007 film. ITV reports that he is 40. Craig played Bond from *Casino Royale* in 2006 to *No Time To Die* in 2021, five films in all.

In the studio's announcement, Pattinson said: "James Bond is one of the most legendary characters in cinema, and to be entrusted with 007 is the honour of a lifetime." Mike Hopkins, head of Prime Video and Amazon MGM Studios, said the studio "proudly introduce[s] Robert Pattinson as the next 007."

## Who is making the film?

According to Amazon MGM Studios:

- **Director:** Denis Villeneuve. He said "there can only be one 007."
- **Writer:** Steven Knight, who wrote the script.
- **Producers:** Amy Pascal (Pascal Pictures) and David Heyman (Heyday Films). They called Pattinson "the perfect Bond for our times."
- **Executive producer:** Tanya Lapointe.

It is the first Bond film since Amazon gained creative control of the franchise. In March 2025, Amazon MGM Studios closed a joint venture with Barbara Broccoli and Michael G. Wilson under which it took creative control of the James Bond property.

## When will the new Bond film be released?

There is no official date. Amazon's announcement does not give a release date or a filming start. Heart reported on 17 November that "everything points towards 2028" and that production is expected to begin in 2027, but it said no exact dates have been given. ITV also reports that filming is expected next year, with a 2028 release. Treat both as expectations, not confirmed dates.

## Who else is in the film?

No other cast has been confirmed. We found nothing from Amazon on who will play M or any other role, so any report naming other actors should be treated as rumour for now.

## Who else was in the running?

ITV reports that Jack Lowden, Josh O'Connor and Callum Turner were reportedly also in contention. Amazon has not commented on other candidates, so this is reporting, not confirmation.

## What is Pattinson doing before Bond?

Amazon says Pattinson is set to appear in *Dune: Part Three* and is in production on *The Batman Part II*. How those schedules fit around Bond has not been explained.

## Quick answers

**Who is the new 007 actor?** Robert Pattinson, announced by Amazon MGM Studios on 16 November 2026.

**Who is directing?** Denis Villeneuve, with a script by Steven Knight.

**Who is the new M?** Not announced.

**When does it come out?** Not confirmed. Reports point to 2028.

## What we do not know yet

- The film's title and exact release date.
- Who will play M and the rest of the cast.
- When filming begins.

Sources: Amazon MGM Studios announcement via Amazon News (16 November 2026) and its Bond updates page; ITV News (16 November 2026); Heart (17 November 2026).""",
    },
    {
        "slug": "2027-predictions-economist-imf-gartner-what-to-expect",
        "title": "2027 Predictions: Economist, IMF and Gartner Forecasts",
        "category": "AI & Tech",
        "meta_description": (
            "What will 2027 bring? The IMF forecasts 3.4% global growth, Gartner names 10 tech trends and The Economist flags 10 risks, from AI debt to Taiwan."
        ),
        "summary": (
            "• The IMF forecasts 3.4% global growth in 2027 while warning of risks from AI-linked debt, bond yields, and workplace disruption affecting 40% of jobs.\n"
            "• The Economist highlights ten major themes including post-Trump politics, Iran conflict risks, commercial space milestones, and rising AI scrutiny.\n"
            "• Gartner names ten strategic tech trends for 2027 spanning AI reasoning models, autonomous exposure remediation, and coding agent harnesses."
        ),
        "image_url": "https://theglobalpulseai.com/articles/2027-predictions.png",
        "content": """What will 2027 look like? Three widely cited outlooks, from The Economist, the International Monetary Fund (IMF) and Gartner, were published between October and November 2026. This guide sums up what each says about the economy, technology and global risks, and where they agree. These are forecasts, not facts, and all of them can change.

Disclosure: this article summarises published reports. The predictions belong to the organisations named, not to us.

## The economy: the IMF expects 3.4% growth

In its World Economic Outlook, released on 13 October 2026, the IMF forecast global growth of 3.1% in 2026, up from 3.0% in its July forecast, and 3.4% in 2027. It said growth was 3.5% in 2025.

The IMF listed several risks:

- Rising debt, including borrowing linked to AI.
- A possible correction in AI-related stock prices.
- Rising bond yields and high borrowing costs for governments.
- Cyberthreats that could disrupt financial systems.

The forecast also assumes oil averaging $96 a barrel and shipments through the Strait of Hormuz resuming by March. IMF Managing Director Kristalina Georgieva described AI's effect on jobs as "a slow moving tsunami, but a tsunami nonetheless," and estimated that about 40% of jobs worldwide will be augmented, downgraded or eliminated. Silvana Tenreyro, the IMF's director of research, said "The outlook is highly uneven."

## The world: ten themes from The Economist

According to a Türkiye Today summary of The Economist's *The World Ahead 2027*, published on 17 November 2026, the magazine's ten themes include:

- **Politics beyond Trump.** The race to succeed him gains prominence. Editor Tom Standage wrote: "The post-Trump era is beginning. But don't expect the president to go quietly."
- **The Iran conflict.** It could disrupt energy flows, fertiliser supplies and food security.
- **Extreme weather.** More heat, drought and wildfires are expected, with renewables possibly gaining ground.
- **AI scrutiny.** Rising corporate debt and opaque financing could raise the risk of an AI market crash.
- **France and Europe.** A possible Marine Le Pen victory could strain the Franco-German partnership.
- **Borrowing costs.** Rising government debt and higher bond yields are pressuring developed economies.
- **China and Taiwan.** Xi Jinping is reportedly seeking to have China's military ready to capture Taiwan by 2027.
- **Weight-loss drugs.** Wider use of treatments such as Ozempic could shift spending towards clothing, cosmetics and fitness.
- **The commercial space race.** SpaceX's Starship is expected to begin regular satellite launches, and the first private space station is set to launch.
- **Hollywood.** Studios are looking for new audiences as low-budget YouTuber productions challenge traditional filmmaking.

We read a summary of the report, not the full text, so check The Economist for the details behind each theme.

## Technology: Gartner's ten trends

On 20 October 2026, Gartner announced its top strategic technology trends for 2027 at its IT Symposium/Xpo. The list is:

1. Large Quantitative Models, for analysing numerical data.
2. Speech Reasoning Models, voice AI that reasons directly on audio.
3. World Models, which let machines simulate outcomes before acting.
4. AI Context Platforms, which give AI agents the knowledge to make decisions.
5. Agent Coding Harness, a control system for autonomous coding agents.
6. AI Agent Identity, controls linking agents to their credentials and actions.
7. Autonomous Exposure Remediation, which finds and fixes security vulnerabilities automatically.
8. Sovereign Tech, designed so organisations can exit critical providers.
9. Disposable Applications, software meant to be retired once its need ends.
10. Wetware as a Service, remote access to biological systems that perform computation.

Gartner makes two predictions along the way. By 2027, it says organisations prioritising semantics in AI-ready data will improve agentic AI accuracy by up to 80% and cut costs by up to 60%. By 2028, it says 25% of enterprise security breaches will trace back to AI agent abuse.

## Where the forecasts agree

- **AI is both the engine and the risk.** The IMF and The Economist both flag AI-linked debt and a possible market correction, while Gartner focuses on AI agents and their security.
- **Borrowing costs matter.** The IMF and The Economist both point to bond yields and government debt.
- **Energy and geopolitics.** The IMF's oil assumption and The Economist's Iran theme both depend on how the conflict develops.

## What we do not know

- Whether growth reaches the IMF's 3.4%. The forecast depends on assumptions about oil and shipping that could change.
- Whether any single event on The Economist's list happens. It describes themes to watch, not certainties.
- How quickly the Gartner trends reach businesses outside large organisations.

This article is for information only and is not investment advice.

Sources: IMF World Economic Outlook, October 2026 (imf.org; coverage by NBC New York, 13 October 2026); Gartner press release, "Gartner Identifies the Top Strategic Technology Trends for 2027" (20 October 2026); Türkiye Today summary of The Economist's The World Ahead 2027 (17 November 2026).""",
    },
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
    {
        "slug": "economic-outlook-2027-imf-oecd-world-bank-forecasts",
        "title": "2027 Economic Outlook: IMF, OECD, World Bank Compared",
        "category": "AI & Tech",
        "meta_description": (
            "IMF 3.4%, OECD 3.0%, World Bank 2.8%: three 2027 global growth forecasts compared, why they differ, and the energy, debt and AI risks all three flag."
        ),
        "summary": (
            "• The IMF forecasts 3.4% global growth for 2027, the OECD 3.0% and the World Bank 2.8%, a 0.6-point gap between the highest and lowest.\n"
            "• The forecasts differ partly because of publication dates, energy price assumptions and, possibly, how national growth rates are weighted.\n"
            "• All three flag Middle East energy risks, rising bond yields and debt, and the chance that AI investment disappoints."
        ),
        "image_url": "https://theglobalpulseai.com/articles/economic-outlook-2027.png",
        "content": """Three major institutions have published global growth forecasts for 2027, and they do not agree. The IMF expects 3.4%, the OECD 3.0% and the World Bank 2.8%. This guide puts the numbers side by side, explains why they differ and lists the risks all three flag. These are forecasts, not facts, and the assumptions behind them can change.

## The forecasts side by side

| Institution | Published | 2026 growth | 2027 growth |
|---|---|---|---|
| IMF | 13 October 2026 | 3.1% | 3.4% |
| OECD | 23 September 2026 | 2.9% | 3.0% |
| World Bank | 11 June 2026 | 2.5% | 2.8% |

CGTN reports that the IMF's 2027 figure is unchanged from its July forecast. Euronews reports that the OECD raised its 2026 forecast by 0.1 percentage point and trimmed 2027 by 0.1. The World Bank said growth should recover to 2.8% in 2027, still 0.4 percentage points below the 2010s average.

The gap between the highest and lowest 2027 forecast is 0.6 percentage points (our arithmetic).

## Why the numbers differ

- **Different dates.** The World Bank published in June, before the OECD and the IMF. Its forecast assumed the worst energy disruptions would ease in July, while the IMF assumes oil and gas shipments through the Strait of Hormuz resume by March.
- **Different weights, possibly.** The IMF has explained that the weights used to add up national growth rates make a big difference to global growth, because purchasing power parity weights give developing countries such as China and India a larger share of the world economy than market exchange rates do. The gap is not new: for 2025 the IMF reports 3.5% growth and the World Bank 2.9%. We did not confirm which weights each institution uses, so treat this as a possible explanation, not a proven one.
- **Different energy assumptions.** The IMF assumes oil averages $96 a barrel in 2026, and the World Bank projects Brent at $94. The OECD says an assumed fall in energy prices in 2027 is projected to help stabilise global growth.

## Inflation and the big economies

- **Inflation:** The IMF expects global headline inflation of 4.7% in 2026, easing to 4.1% in 2027. The World Bank expects 4.0% in 2026, up from 3.3% in 2025. The OECD puts G20 headline inflation at 4.1% in 2026. These measures cover different groups of countries, so compare them with care.
- **United States:** The IMF forecasts 2.3% growth in both 2026 and 2027. The OECD forecasts 2.2% for 2026.
- **Euro area:** The IMF forecasts 1.1% in 2026 and 1.2% in 2027, according to the Associated Press. The OECD forecasts 1.0% in both years.
- **Emerging and developing economies:** The IMF forecasts 3.7% in 2026 and 4.4% in 2027. The World Bank forecasts 3.6% and 4.2%.

## The risks all three flag

- **Energy and the Middle East.** The World Bank says growth could fall to 1.3% in 2026 if energy disruption is more severe and comes with substantial financial stress. The OECD lists prolonged disruption to Middle East exports among its main risks.
- **Debt and bond yields.** The IMF points to rising debt, including AI-related borrowing, and high borrowing costs. The OECD cites further rises in long-term government bond yields.
- **AI investment.** The IMF warns of a possible correction in AI-related stock prices. The OECD flags AI investment returns that fall short of expectations, and the World Bank lists equity corrections in technology.
- **Weather.** The OECD names a very strong El Nino and its effect on harvests and food prices. The World Bank cites more frequent weather-related disasters.

The IMF also says there is about a 10% chance that global growth in 2027 falls below 2%, down from 20% in its April estimate.

## What we do not know

- Whether oil and gas shipments resume on the IMF's timetable. Its 3.4% forecast depends on it.
- Whether the World Bank will revise its June forecast. The sources we checked show nothing newer.
- The OECD's 2027 forecasts for inflation and for the United States, which the pages we read did not give.
- Which weighting method each institution uses.

This article is for information only and is not investment advice.

Sources: IMF, World Economic Outlook, October 2026 (imf.org, 13 October 2026) and Chapter 1; Associated Press coverage via NBC New York (13 October 2026); CGTN (13 October 2026); OECD, Interim Economic Outlook, September 2026 (oecd.org) and Euronews (23 September 2026); World Bank, Global Economic Prospects, June 2026 (press release, 11 June 2026); IMF Finance & Development, Purchasing Power Parity: Weights Matter.""",
    },
    {
        "slug": "gta-6-physical-copy-uk-code-in-box-no-disc-your-rights",
        "title": "GTA 6 Physical Copy in the UK: No Disc, What Is in the Box",
        "category": "Entertainment",
        "meta_description": (
            "GTA 6 boxed copies in the UK hold a download code, not a disc. What is in the box, the £64.99 price, and what your rights are if the code fails."
        ),
        "summary": (
            "• Rockstar confirmed that physical GTA 6 copies contain a code for the digital download and no disc, with boxes reaching stores on 12 November, a week before the 19 November launch.\n"
            "• UK reports list the boxed Standard Edition at £64.99 at Argos, against £69.99 for the digital download, with a code, an empty disc spindle and an A3 poster in the box.\n"
            "• If a code fails, the Consumer Rights Act 2015 covers faulty digital content, but whether a boxed code counts as goods or digital content is not settled in the sources we checked."
        ),
        "image_url": "https://theglobalpulseai.com/articles/gta-6-physical-copy-uk.png",
        "content": """If you bought GTA 6 in a UK shop, the box does not contain a game disc. Rockstar confirmed that physical copies hold a code for the digital download instead. This guide explains what is in the box, what it costs, what you give up compared with a disc, and what the law says if the code does not work. Details come from the sources named below and can change.

## What Rockstar confirmed

GamesRadar reported on 24 June 2026 that Rockstar confirmed physical copies are "a code in a box". The listing states that "a disk will not be included in the box". According to GamesRadar, physical copies reach stores on 12 November, a week before the 19 November launch, so buyers can pre-load the game.

TechRadar adds that players get a digital licence for the game instead of a disc. Both outlets say fans reacted with disappointment. TechRadar offers one explanation, that Rockstar may be trying to reduce leaks, and presents it as speculation.

## What is in the UK box

ShopAppy, summarising reports from the Mirror and the Express, lists three things in the box:

- A download code.
- An empty plastic disc spindle.
- A double-sided A3 poster.

The code works on consoles without a disc drive, such as the PS5 Digital Edition, according to ShopAppy.

## Price and where to buy

| Version | UK price | Source |
|---|---|---|
| Standard Edition, download | £69.99 | Novuna Personal Finance, via ShopAppy |
| Standard Edition, boxed code | £64.99 at Argos | The Mirror, via ShopAppy |
| Ultimate Edition | £89.99, digital only | ShopAppy |

ShopAppy, citing the Mirror, lists Argos, Currys, Amazon UK and GAME as stockists of the boxed copy. Prices change often, so confirm the figure at checkout.

## What you give up compared with a disc

- **You must download the game.** The box holds a code, not the game itself.
- **Resale is unclear.** GamesRadar's writer argues that anyone hoping to resell the game or keep a lasting physical version is out of luck. We did not find a statement from Rockstar on resale.
- **No boxed Ultimate Edition.** ShopAppy says the Ultimate Edition has no boxed version.

## If your code does not work

ShopAppy reports, citing Power Up Gaming on 13 November, that some sealed copies had codes that were rejected or already redeemed. It says the scale is not established. Contact the retailer that sold you the box first.

On your legal rights, the Consumer Rights Act 2015 covers digital content:

- **Repair or replacement.** Section 43 says the trader must fix or replace faulty digital content within a reasonable time, at no cost to you.
- **Price reduction.** Section 44 lets you ask for a reduction, which can be the full price, if repair or replacement is impossible or not done in a reasonable time.
- **Refund.** Section 45 gives the right to a refund of all money paid, within 14 days of the trader agreeing you are entitled to it, using your original payment method.

For changing your mind, Which? explains that to get a download within the 14-day cancellation period you must agree to waive your cancellation rights, and that you lose the right to cancel once the download starts. It also lists software with a broken seal among the exemptions.

## Before you buy

- **Check the retailer's returns policy** before you open the box.
- **Keep your receipt** and a photo of the code's packaging if the code is rejected.
- **Do not redeem the code until you are ready to download**, because opening the seal and downloading may affect your cancellation rights.
- **Buy from a shop, not a private seller**, if you want the strongest protection, as ShopAppy advises.

## What we do not know

- Whether the law treats a boxed code as goods or as digital content. The sources we checked do not say, so ask the retailer or Citizens Advice.
- How many boxes shipped with faulty codes.
- Whether Rockstar will release a disc version later. GamesRadar's writer hopes the code-in-a-box approach is temporary, but gives no evidence for it.
- Current stock and prices at each UK retailer.

This article is for information only and is not legal advice.

Sources: GamesRadar, "GTA 6 physical copies are a code in a box" (24 June 2026); TechRadar, "GTA 6 physical copies have a download code in the box" (24 June 2026); ShopAppy, "GTA 6 in the UK: boxed code vs download" (updated 28 November 2026); Consumer Rights Act 2015, sections 43 to 45 (legislation.gov.uk); Which?, Consumer Contracts Regulations guide.""",
    },
]


def publish_or_update_article(db, item: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
    slug = item["slug"]
    title = item["title"]
    category = item["category"]
    meta_desc = item["meta_description"]
    summary = item["summary"]
    content = item["content"]
    image_url = item.get("image_url")

    existing = db.query(Article).filter(Article.slug == slug).first()

    if existing:
        action = "updated"
        article_id = existing.id
        if not dry_run:
            existing.title = title
            existing.category = category
            existing.content = content
            existing.summary = summary
            if image_url is not None:
                existing.image_url = image_url
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
                "image_url": image_url,
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
        "image_url": image_url,
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
            print(f"  Image URL : {res.get('image_url')}")
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
