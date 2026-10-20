import os
import json
import hashlib
import threading
import wsgiref.simple_server
from typing import Dict, Any, Optional, List
from pathlib import Path
from google_auth_oauthlib.flow import (
    InstalledAppFlow,
    _RedirectWSGIApp,
    _ExclusiveWSGIServer,
    _WSGIRequestHandler,
)

# Paths for OAuth credentials (Backend Root Directory)
BASE_DIR = Path(__file__).resolve().parent.parent
CLIENT_SECRETS_FILE = BASE_DIR / "client_secret.json"
TOKEN_FILE = BASE_DIR / "token.json"

def sync_render_credentials():
    """
    On Render.com or containerized cloud deployments, client_secret.json and token.json
    cannot and should not be checked into Git. Instead, users provide them as environment
    variables:
      - YOUTUBE_CLIENT_SECRET_JSON: Raw JSON string of Google OAuth client secrets
      - YOUTUBE_TOKEN_JSON: Raw JSON string of the authorized token
    This function detects those environment variables and automatically writes them to
    token.json and client_secret.json on startup so YouTube uploads work on Render.
    """
    secret_env = os.getenv("YOUTUBE_CLIENT_SECRET_JSON")
    if secret_env and secret_env.strip():
        try:
            raw_text = secret_env.strip()
            target_paths = [CLIENT_SECRETS_FILE]
            if BASE_DIR.parent != BASE_DIR:
                target_paths.append(BASE_DIR.parent / "client_secret.json")
            for target_path in target_paths:
                try:
                    with open(target_path, "w", encoding="utf-8") as f:
                        f.write(raw_text)
                except Exception:
                    pass
            print("[YouTube Auth] Materialized client_secret.json from YOUTUBE_CLIENT_SECRET_JSON environment variable.")
        except Exception as e:
            print(f"[YouTube Auth] Warning: Failed writing YOUTUBE_CLIENT_SECRET_JSON: {e}")

    token_env = os.getenv("YOUTUBE_TOKEN_JSON")
    if token_env and token_env.strip():
        try:
            raw_text = token_env.strip()
            target_paths = [TOKEN_FILE]
            if BASE_DIR.parent != BASE_DIR:
                target_paths.append(BASE_DIR.parent / "token.json")
            for target_path in target_paths:
                try:
                    with open(target_path, "w", encoding="utf-8") as f:
                        f.write(raw_text)
                except Exception:
                    pass
            print("[YouTube Auth] Materialized token.json from YOUTUBE_TOKEN_JSON environment variable.")
        except Exception as e:
            print(f"[YouTube Auth] Warning: Failed writing YOUTUBE_TOKEN_JSON: {e}")

# Materialize credentials if present in environment
sync_render_credentials()

# Scope for YouTube Video & Shorts Upload
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

PUBLIC_SITE_URL = os.getenv("PUBLIC_SITE_URL", os.getenv("FRONTEND_URL", "https://globalpulse.ai")).rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", PUBLIC_SITE_URL).rstrip("/")
ADMIN_DASHBOARD_URL = f"{FRONTEND_URL}/admin"

_active_auth_server = None
_active_auth_thread = None

def get_oauth_success_html() -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>YouTube Channel Connected | GlobalPulse AI</title>
  <meta http-equiv="refresh" content="3;url={ADMIN_DASHBOARD_URL}" />
  <style>
    body {{
      background: #030712;
      color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }}
    .card {{
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(6, 182, 212, 0.4);
      padding: 40px;
      border-radius: 24px;
      box-shadow: 0 0 40px rgba(6, 182, 212, 0.25);
      max-width: 480px;
      margin: 20px;
    }}
    .icon {{ font-size: 54px; margin-bottom: 12px; }}
    h1 {{ color: #38bdf8; margin: 0 0 10px; font-size: 24px; font-weight: 800; }}
    p {{ color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 8px 0; }}
    .badge {{
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      margin: 12px 0;
    }}
    .btn {{
      display: inline-block;
      margin-top: 24px;
      padding: 12px 28px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: #030712;
      font-weight: 800;
      border-radius: 12px;
      text-decoration: none;
      font-size: 13px;
      box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4);
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎉</div>
    <div class="badge">CHANNEL CONNECTED</div>
    <h1>YouTube Authorization Complete!</h1>
    <p>Your Google account and YouTube channel (<strong>EduHubbySaeed</strong>) are successfully authorized for automated Shorts publishing.</p>
    <p style="color: #64748b; font-size: 12px;">Token saved to backend/token.json. Auto-redirecting to Admin Dashboard...</p>
    <a href="{ADMIN_DASHBOARD_URL}" class="btn">Return to Admin Dashboard</a>
  </div>
</body>
</html>
"""

OAUTH_SUCCESS_HTML = get_oauth_success_html()


class YouTubeUploadResult(str):
    """
    String subclass that holds the youtube_video_id as string
    while also supporting dict-style and attribute access for versatility.
    """
    def __new__(cls, video_id: str, **kwargs):
        obj = super().__new__(cls, video_id)
        obj.video_id = video_id
        obj.youtube_video_id = video_id
        obj._data = kwargs
        return obj

    def get(self, key: str, default: Any = None) -> Any:
        if key in ("video_id", "youtube_video_id"):
            return str(self)
        return self._data.get(key, default)

    def __getitem__(self, key: str) -> Any:
        if key in ("video_id", "youtube_video_id"):
            return str(self)
        return self._data[key]


class _HtmlRedirectWSGIApp(_RedirectWSGIApp):
    def __call__(self, environ, start_response):
        import wsgiref.util
        self.last_request_uri = wsgiref.util.request_uri(environ)
        # Send instant HTTP 302 redirect back to Admin Dashboard
        start_response("302 Found", [
            ("Location", f"{ADMIN_DASHBOARD_URL}?youtube=connected"),
            ("Content-Type", "text/plain")
        ])
        return [b"YouTube connected! Redirecting to Admin Dashboard..."]



def get_oauth_authorization_url(preferred_port: int = 8088) -> str:
    """
    Spawns a local WSGI listener on port 8088 in a background thread,
    constructs the official Google OAuth2 login URL,
    and returns auth_url immediately so FastAPI can redirect the user's browser.
    """
    global _active_auth_server, _active_auth_thread

    sync_render_credentials()

    if not CLIENT_SECRETS_FILE.exists():
        raise FileNotFoundError(
            f"client_secret.json not found in {BASE_DIR}. "
            "If deployed on Render, please add the 'YOUTUBE_CLIENT_SECRET_JSON' environment variable."
        )

    # Close previous server instance if still hanging
    if _active_auth_server is not None:
        try:
            _active_auth_server.server_close()
        except Exception:
            pass
        _active_auth_server = None

    flow = InstalledAppFlow.from_client_secrets_file(
        str(CLIENT_SECRETS_FILE),
        SCOPES
    )

    wsgi_app = _HtmlRedirectWSGIApp(OAUTH_SUCCESS_HTML)

    try:
        local_server = wsgiref.simple_server.make_server(
            "localhost",
            preferred_port,
            wsgi_app,
            server_class=_ExclusiveWSGIServer,
            handler_class=_WSGIRequestHandler,
        )
    except Exception:
        local_server = wsgiref.simple_server.make_server(
            "localhost",
            0,
            wsgi_app,
            server_class=_ExclusiveWSGIServer,
            handler_class=_WSGIRequestHandler,
        )

    _active_auth_server = local_server
    actual_port = local_server.server_port
    flow.redirect_uri = f"http://localhost:{actual_port}/"

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true"
    )

    def _worker():
        global _active_auth_server
        try:
            local_server.timeout = 300  # 5 minutes
            local_server.handle_request()
            if hasattr(wsgi_app, "last_request_uri") and wsgi_app.last_request_uri:
                auth_resp = wsgi_app.last_request_uri.replace("http://", "https://")
                flow.fetch_token(authorization_response=auth_resp)
                creds = flow.credentials
                with open(TOKEN_FILE, "w") as f:
                    f.write(creds.to_json())
                print(f"[YouTube Auth] SUCCESS: Successfully saved credentials to {TOKEN_FILE}!")
        except Exception as e:
            print(f"[YouTube Auth] Listener error: {e}")
        finally:
            try:
                local_server.server_close()
            except Exception:
                pass
            _active_auth_server = None

    _active_auth_thread = threading.Thread(target=_worker, daemon=True)
    _active_auth_thread.start()

    print(f"[YouTube Auth] Listening on http://localhost:{actual_port}/ for Google OAuth2 callback...")
    return auth_url


def check_auth_status() -> Dict[str, Any]:
    """Check if valid token.json exists on disk."""
    sync_render_credentials()
    if not TOKEN_FILE.exists():
        return {
            "authenticated": False,
            "message": "Not authenticated. Click 'Authorize YouTube Channel' to log in."
        }
    try:
        from google.oauth2.credentials import Credentials
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        return {
            "authenticated": bool(creds and (creds.valid or creds.refresh_token)),
            "message": "Authenticated with YouTube!",
            "token_file": str(TOKEN_FILE),
            "channel": "EduHubbySaeed"
        }
    except Exception as e:
        return {"authenticated": False, "message": f"Invalid token file: {e}"}


def get_authenticated_youtube_service(interactive: bool = False):
    """
    Authenticate with YouTube Data API v3 using Google OAuth2.
    1. Checks token.json in backend root directory.
    2. If valid, uses it.
    3. If expired, refreshes via refresh_token.
    4. If missing, returns None or triggers flow.
    """
    sync_render_credentials()
    print("Authenticating with YouTube...")

    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    import googleapiclient.discovery

    creds = None

    # Step 1: Check if token.json exists
    if TOKEN_FILE.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
            print(f"[YouTube Auth] Found existing token file: {TOKEN_FILE}")
        except Exception as e:
            print(f"[YouTube Auth] Warning: Could not parse token.json ({e}).")
            creds = None

    # Step 2: Validate or Refresh Credentials
    if creds and creds.valid:
        print("[YouTube Auth] Existing credentials are valid.")
    elif creds and creds.expired and creds.refresh_token:
        print("[YouTube Auth] Credentials expired. Refreshing token via refresh_token...")
        try:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as token:
                token.write(creds.to_json())
            print(f"[YouTube Auth] Token refreshed and saved to {TOKEN_FILE}.")
        except Exception as e:
            print(f"[YouTube Auth] Token refresh failed ({e}).")
            creds = None

    # Step 3: Check if credentials missing
    if not creds or not creds.valid:
        if not interactive:
            print("[YouTube Auth] token.json not found or expired.")
            print("[YouTube Auth] Please click 'Authorize YouTube Channel' on Admin Dashboard or visit /api/auth-youtube.")
            return None

        # Fallback to local server if specifically asked
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS_FILE), SCOPES)
        creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    # Build and return the authenticated YouTube client
    youtube_client = googleapiclient.discovery.build(
        YOUTUBE_API_SERVICE_NAME,
        YOUTUBE_API_VERSION,
        credentials=creds
    )
    return youtube_client


def get_category_id(category_name: str) -> str:
    """Map news categories to standard YouTube Video Category IDs."""
    if "tech" in category_name.lower() or "science" in category_name.lower():
        return "28"  # Science & Technology
    return "25"      # News & Politics


def upload_video_to_youtube(
    video_path: str,
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
    category_id: str = "28",
    video_format: str = "long",
    interactive: bool = False
) -> YouTubeUploadResult:
    """
    Upload an MP4 video file to YouTube via YouTube Data API v3.
    Enforces strict pre-upload validation gate (existence, >=100KB size, >=5s duration).
    Follows OAuth2 flow, logs progress to terminal, and returns youtube_video_id.
    Supports long-form (16:9 standard video) and short-form (9:16 Shorts) modes.
    """
    is_long = (str(video_format).lower() == "long")
    print(f"[YouTube Upload] Preparing {'Long-Form (16:9)' if is_long else 'Short (9:16)'} video upload: '{title}'...")
    print(f"[YouTube Upload] Video file path: {video_path}")

    # Step 1: Resolve Video Path
    v_path = Path(video_path)
    if not v_path.exists() or not v_path.is_absolute():
        cleaned_path = str(video_path).replace("\\", "/").lstrip("/")
        candidates = [
            BASE_DIR / cleaned_path,
            BASE_DIR / "static" / "videos" / v_path.name,
            BASE_DIR.parent / cleaned_path,
            Path(video_path).resolve()
        ]
        found = False
        for cand in candidates:
            if cand.exists() and cand.is_file():
                v_path = cand
                found = True
                break
        if not found and not v_path.exists():
            raise FileNotFoundError(
                f"[YouTube Upload Validation Gate FAILED] Video file does not exist at '{video_path}'. "
                f"Ensure the video has been properly generated first."
            )

    # Step 2: Validation Gate - File Size Check (>= 100 KB)
    file_size = v_path.stat().st_size
    print(f"[YouTube Upload] Validating file size: {file_size:,} bytes for '{v_path.name}'...")
    if file_size < 100_000:
        raise ValueError(
            f"[YouTube Upload Validation Gate FAILED] Video file '{v_path.name}' is too small or incomplete "
            f"({file_size} bytes). Minimum required size is 100,000 bytes (100 KB). Aborting upload to prevent YouTube processing failure."
        )

    # Step 3: Validation Gate - Duration Check (>= 5.0 seconds)
    from .video_generator import probe_media_duration
    video_duration = probe_media_duration(v_path)
    print(f"[YouTube Upload] Validating video duration: {video_duration:.2f}s...")
    if video_duration < 5.0:
        raise ValueError(
            f"[YouTube Upload Validation Gate FAILED] Video file '{v_path.name}' duration ({video_duration:.2f}s) "
            f"is below the 5.0-second minimum. Aborting upload to prevent YouTube processing failure."
        )

    print(f"[YouTube Upload] Pre-upload validation PASSED ({file_size:,} bytes, {video_duration:.1f}s). Proceeding to YouTube Data API...")

    from googleapiclient.http import MediaFileUpload

    youtube = None
    try:
        youtube = get_authenticated_youtube_service(interactive=interactive)
    except Exception as e:
        print(f"[YouTube Upload] Authentication issue: {e}")

    # Real YouTube API Upload if authenticated
    if youtube:
        try:
            if is_long:
                # Long-Form Title: clean, high-CTR, no #shorts
                clean_t = re.sub(r"(?i)\s*#shorts\b", "", title).strip()
                if len(clean_t) <= 68:
                    upload_title = f"{clean_t} | Global News & Analysis"
                else:
                    upload_title = clean_t[:100]
                default_tags = ["GlobalPulse AI", "News", "Technology", "World News", "Market Analysis", "EduHub by Saeed"]
            else:
                raw_title = f"{title.strip()} #shorts" if "#shorts" not in title.lower() else title.strip()
                upload_title = raw_title[:100]
                default_tags = ["GlobalPulse AI", "News", "Technology", "Shorts"]

            body = {
                "snippet": {
                    "title": upload_title,
                    "description": description,
                    "tags": tags or default_tags,
                    "categoryId": category_id,
                },
                "status": {
                    "privacyStatus": "public",
                    "selfDeclaredMadeForKids": False,
                },
            }

            print(f"Uploading {'long-form' if is_long else 'short'} video...")
            media = MediaFileUpload(
                str(v_path),
                mimetype="video/mp4",
                resumable=True,
                chunksize=1024 * 1024
            )

            request = youtube.videos().insert(
                part="snippet,status",
                body=body,
                media_body=media
            )

            response = None
            while response is None:
                upload_status, response = request.next_chunk()
                if upload_status:
                    progress_pct = int(upload_status.progress() * 100)
                    print(f"Uploading video... {progress_pct}%")

            youtube_video_id = response.get("id")
            if youtube_video_id:
                print(f"Upload successful! Video ID: {youtube_video_id}")
                watch_url = f"https://www.youtube.com/watch?v={youtube_video_id}" if is_long else f"https://www.youtube.com/shorts/{youtube_video_id}"
                return YouTubeUploadResult(
                    youtube_video_id,
                    success=True,
                    youtube_url=watch_url,
                    title=upload_title,
                    format="long" if is_long else "short",
                    is_simulated=False
                )
        except Exception as e:
            print(f"[YouTube Upload] Real YouTube API upload error: {e}")
            raise RuntimeError(f"YouTube Data API upload failed: {e}")

    raise RuntimeError("YouTube is not authenticated. Please authorize your channel from the Admin Dashboard.")


def upload_long_video_to_youtube(
    video_filepath: str,
    title: str,
    summary: str,
    category: str,
    slug: str,
    content: str = ""
) -> Dict[str, Any]:
    """
    Uploads full-length 16:9 widescreen long-form video to YouTube with chapters,
    authoritative SEO metadata, and link to website article and YouTube partner channel.
    """
    clean_summary = summary.replace("•", "-")
    website_url = f"{PUBLIC_SITE_URL}/news/{slug}"

    description = f"""{clean_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 VIDEO CHAPTERS / TIMESTAMPS:
00:00 - Breaking Intelligence Briefing
00:35 - Key Operational Findings & Summary
01:15 - In-Depth Investigative Analysis
02:00 - Strategic & Global Market Implications
02:45 - Official Partner & Community Outro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Read Full Detailed Investigation on GlobalPulse AI:
👉 {website_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stay ahead of global shifts with daily deep-dive intelligence briefings.
Subscribe to EduHub by Saeed (@EduHubbySaeed) for cutting-edge AI, software engineering, and autonomous systems masterclasses:
👉 https://www.youtube.com/@EduHubbySaeed

#{category.replace(' ', '').replace('&', '')} #News #GlobalMarkets #Technology #GlobalPulseAI #EduHubbySaeed #WorldNews #IntelligenceBriefing
"""

    tags = ["GlobalPulse AI", category, "Breaking News", "World News", "Technology", "Markets", "Documentary", "EduHub by Saeed"]
    cat_id = get_category_id(category)

    result = upload_video_to_youtube(
        video_path=video_filepath,
        title=title,
        description=description,
        tags=tags,
        category_id=cat_id,
        video_format="long",
        interactive=False
    )

    video_id = str(result)
    return {
        "success": True,
        "video_id": video_id,
        "youtube_video_id": video_id,
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
        "title": getattr(result, "title", title),
        "format": "long",
        "is_simulated": getattr(result, "is_simulated", False) if hasattr(result, "is_simulated") else result.get("is_simulated", False)
    }


def upload_short_to_youtube(
    video_filepath: str,
    title: str,
    summary: str,
    category: str,
    slug: str,
    video_format: str = "long"
) -> Dict[str, Any]:
    """
    Main upload entry point. Defaults to 16:9 Long-Form Video upload.
    Set video_format='short' to upload as a YouTube Short.
    """
    if str(video_format).lower() == "long":
        return upload_long_video_to_youtube(
            video_filepath=video_filepath,
            title=title,
            summary=summary,
            category=category,
            slug=slug
        )

    clean_summary = summary.replace("•", "-")
    website_url = f"{PUBLIC_SITE_URL}/news/{slug}"

    description = f"""{clean_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Read Full Detailed Investigation on GlobalPulse AI:
👉 {website_url}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stay ahead of global shifts with daily 60-second intelligence briefings.
Subscribe to GlobalPulse AI for Tier-1 news and market analysis.

#GlobalPulseAI #News #Technology #Shorts #GlobalMarkets #{category.replace(' ', '').replace('&', '')}
"""

    tags = ["GlobalPulse AI", category, "Breaking News", "Shorts", "Tech", "Markets"]
    cat_id = get_category_id(category)

    result = upload_video_to_youtube(
        video_path=video_filepath,
        title=title,
        description=description,
        tags=tags,
        category_id=cat_id,
        video_format="short",
        interactive=False
    )

    video_id = str(result)
    return {
        "success": True,
        "video_id": video_id,
        "youtube_video_id": video_id,
        "youtube_url": f"https://www.youtube.com/shorts/{video_id}",
        "title": title,
        "format": "short",
        "is_simulated": getattr(result, "is_simulated", False) if hasattr(result, "is_simulated") else result.get("is_simulated", False)
    }
