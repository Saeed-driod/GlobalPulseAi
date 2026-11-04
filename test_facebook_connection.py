#!/usr/bin/env python
"""
GlobalPulse AI - Facebook Page Connection Test Utility
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

from services.facebook_poster import check_facebook_auth, post_article_to_facebook

def main():
    print("=" * 70)
    print("  GLOBALPULSE AI - FACEBOOK PAGE INTEGRATION TEST")
    print("======================================================================")

    auth = check_facebook_auth()
    if not auth.get("authenticated"):
        print("\n[!] Facebook is NOT connected.")
        print(f"Details: {auth.get('message')}")
        print("\nTo connect your Facebook Page, add the following to backend/.env:")
        print("  FACEBOOK_PAGE_ID=your_page_numeric_id")
        print("  FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token")
        return

    print("\n[SUCCESS] Facebook Page Successfully Connected!")
    print(f"  Page Name : {auth.get('page_name')}")
    print(f"  Page ID   : {auth.get('page_id')}")
    print(f"  Page Link : {auth.get('page_link')}")
    print(f"  Followers : {auth.get('fan_count')}")

    choice = input("\nDo you want to post a test link to this Page right now? (y/n) [default: n]: ").strip().lower()
    if choice == "y":
        print("\nPublishing test post to Facebook...")
        res = post_article_to_facebook(
            title="GlobalPulse AI - Global Intelligence & Video Network",
            summary="Real-time geopolitical, financial market, and technological intelligence for Tier-1 decision makers.",
            article_url="https://globalpulseai.vercel.app",
            category="AI & Tech"
        )
        if res.get("success"):
            print(f"[SUCCESS] Post is live on Facebook: {res.get('post_url')}")
        else:
            print(f"[ERROR] Failed to post: {res.get('error')}")

if __name__ == "__main__":
    main()

