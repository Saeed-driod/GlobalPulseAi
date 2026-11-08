"""
GlobalPulse AI - Official TikTok One-Click OAuth Authenticator
Opens the TikTok authorization page in your browser, receives the callback code,
and exchanges it for rotating tokens.
"""
import sys
import webbrowser
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(ROOT_DIR))

from services.tiktok_uploader import get_authorization_url, exchange_code_for_tokens, TIKTOK_CLIENT_KEY

def main():
    print("=" * 70)
    print("  GLOBALPULSE AI - TIKTOK FOR DEVELOPERS OAUTH AUTHENTICATOR")
    print("======================================================================")
    
    if not TIKTOK_CLIENT_KEY:
        print("[!] TIKTOK_CLIENT_KEY not configured in backend/.env!")
        return

    redirect_uri = "https://globalpulseai.vercel.app"
    auth_url = get_authorization_url(redirect_uri=redirect_uri)
    
    print("\n[Step 1] Opening TikTok Authorization in your browser...")
    print(f"\nIf browser does not open automatically, visit this URL:\n{auth_url}\n")
    try:
        webbrowser.open(auth_url)
    except Exception:
        pass

    print("[Step 2] After clicking 'Authorize' in your browser, TikTok will redirect")
    print("         you to: https://globalpulseai.vercel.app/?code=XXXXX&state=...")
    print("         Copy the 'code' parameter from the address bar and paste it below:")
    print("-" * 70)
    
    code = input("\nEnter the 'code' from browser address bar: ").strip()
    if not code:
        print("[!] No code entered. Aborting.")
        return
        
    # If full URL was pasted, parse code
    if "code=" in code:
        parsed = urllib.parse.urlparse(code)
        params = urllib.parse.parse_qs(parsed.query)
        code = params.get("code", [code])[0]

    print("\n[Step 3] Exchanging authorization code for rotating tokens...")
    res = exchange_code_for_tokens(code, redirect_uri=redirect_uri)
    
    if res.get("success"):
        print("\n✔ [SUCCESS] TikTok Account Successfully Connected!")
        print("  Rotating access and refresh tokens have been securely saved to backend/tiktok_token.json.")
        print("  Master Worker will now automatically publish videos to your TikTok feed!")
    else:
        print(f"\n[!] Failed to authenticate: {res.get('error')}")

if __name__ == "__main__":
    main()

