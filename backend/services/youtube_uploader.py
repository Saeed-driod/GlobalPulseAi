import os
import re
import sys
import time
import json
import hashlib
import threading
import traceback
import socket
import http.client
import wsgiref.simple_server
from typing import Dict, Any, Optional, List
from pathlib import Path
from googleapiclient.errors import HttpError
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

# Scope for YouTube Video & Shorts Upload and Management
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload"
]
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
    <p>Your Google account and YouTube channel (<strong>GloblePulseAi</strong>) are successfully authorized for automated Shorts publishing.</p>
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
            "channel": "GloblePulseAi"
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
    c = str(category_name).lower()
    if "sport" in c:
        return "17"  # Sports
    if "tech" in c or "science" in c:
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
    Includes resilient chunked upload with exponential backoff and strict exception logging for large files.
    """
    is_long = (str(video_format).lower() == "long")
    format_label = "16:9 Long-Form Widescreen HD" if is_long else "9:16 Vertical YouTube Shorts"
    print(f"\n[YouTube Upload] Initializing {format_label} upload workflow...")
    print(f"[YouTube Upload] Target Title: '{title}'")
    print(f"[YouTube Upload] Provided Path: {video_path}")

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
            err_msg = (
                f"[YouTube Upload Validation Gate FAILED] Video file does not exist at '{video_path}'. "
                f"Searched candidates: {[str(c) for c in candidates]}. "
                f"Ensure the video has been properly generated and saved via video_generator first."
            )
            print(f"[YouTube Upload ERROR] {err_msg}")
            raise FileNotFoundError(err_msg)

    # Step 2: Validation Gate - File Size Check
    file_size = v_path.stat().st_size
    file_size_mb = file_size / (1024 * 1024)
    print(f"[YouTube Upload] Validating file size: {file_size:,} bytes ({file_size_mb:.2f} MB) for '{v_path.name}'...")
    if file_size < 100_000:
        err_msg = (
            f"[YouTube Upload Validation Gate FAILED] Video file '{v_path.name}' is too small or incomplete "
            f"({file_size:,} bytes, {file_size_mb:.3f} MB). Minimum required size is 100,000 bytes (100 KB). "
            f"Aborting upload to prevent YouTube processing failure."
        )
        print(f"[YouTube Upload ERROR] {err_msg}")
        raise ValueError(err_msg)

    # Step 3: Validation Gate - Duration Check
    from .video_generator import probe_media_duration
    video_duration = probe_media_duration(v_path)
    print(f"[YouTube Upload] Validating video duration: {video_duration:.2f}s...")
    min_required_duration = 15.0 if is_long else 5.0
    if video_duration < min_required_duration:
        err_msg = (
            f"[YouTube Upload Validation Gate FAILED] Video file '{v_path.name}' duration ({video_duration:.2f}s) "
            f"is below the {min_required_duration:.1f}-second minimum required for {format_label}. "
            f"Aborting upload to prevent YouTube rejection."
        )
        print(f"[YouTube Upload ERROR] {err_msg}")
        raise ValueError(err_msg)

    print(
        f"[YouTube Upload Validation PASSED] Gate verified: "
        f"Format={format_label} | Size={file_size_mb:.2f} MB ({file_size:,} bytes) | "
        f"Duration={video_duration:.2f}s | Path={v_path.resolve()}"
    )

    from googleapiclient.http import MediaFileUpload

    youtube = None
    try:
        youtube = get_authenticated_youtube_service(interactive=interactive)
    except Exception as e:
        print(f"[YouTube Upload] Authentication issue during service acquisition: {e}")
        print(traceback.format_exc())

    if not youtube:
        err_auth = "YouTube is not authenticated. Please authorize your channel from the Admin Dashboard or visit /api/auth-youtube."
        print(f"[YouTube Upload ERROR] {err_auth}")
        raise RuntimeError(err_auth)

    # Real YouTube API Upload
    try:
        if is_long:
            # Long-Form Title: DO NOT append #shorts! Use title[:95]
            clean_t = re.sub(r"(?i)\s*#shorts\b", "", title).strip()
            upload_title = clean_t[:95]
            if category_id == "17":
                default_tags = ["GlobalPulse AI", "GloblePulseAi", "Global Sports", "Sports", "Match Analysis", "Highlights"]
            elif "politics" in str(category).lower() or "geopolitics" in str(category).lower():
                default_tags = ["GlobalPulse AI", "GloblePulseAi", "World Politics", "Politics", "Elections", "Breaking News", "Diplomacy", "Geopolitics", "World Leaders"]
            else:
                default_tags = ["GlobalPulse AI", "GloblePulseAi", "News", "Technology", "World News", "Market Analysis"]
        else:
            raw_title = f"{title.strip()} #shorts" if "#shorts" not in title.lower() else title.strip()
            upload_title = raw_title[:100]
            if "politics" in str(category).lower() or "geopolitics" in str(category).lower():
                default_tags = ["GlobalPulse AI", "GloblePulseAi", "World Politics", "Shorts", "Politics", "Elections", "Breaking News", "Diplomacy"]
            else:
                default_tags = ["GlobalPulse AI", "GloblePulseAi", "News", "Technology", "Shorts"]

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

        # MediaFileUpload chunksize: 4MB with explicit retry handling for HttpError and socket timeouts
        chunk_size = 4 * 1024 * 1024  # 4 MB
        print(f"[YouTube Upload] Configuring {chunk_size / (1024*1024):.0f}MB resumable chunks for {'16:9 Long-Form' if is_long else 'Shorts'} video ({file_size_mb:.2f} MB total).")

        expected_chunks = max(1, (file_size + chunk_size - 1) // chunk_size)
        print(f"[YouTube Upload] Media stream ready: ~{expected_chunks} chunk(s) expected. Starting upload for '{upload_title}'...")

        media = MediaFileUpload(
            str(v_path),
            mimetype="video/mp4",
            resumable=True,
            chunksize=chunk_size
        )

        request = youtube.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media
        )

        response = None
        max_chunk_retries = 5
        retry_delay = 2.0
        chunk_retry_count = 0
        chunk_index = 0

        # Resumable chunk upload loop with exponential backoff on retryable network / server errors
        while response is None:
            try:
                chunk_index += 1
                upload_status, response = request.next_chunk()
                if upload_status:
                    progress_pct = int(upload_status.progress() * 100)
                    transferred_mb = upload_status.resumable_progress / (1024 * 1024)
                    print(
                        f"[YouTube Upload Progress] Chunk {chunk_index}/{expected_chunks}: "
                        f"{progress_pct}% complete ({transferred_mb:.2f} MB of {file_size_mb:.2f} MB transferred)"
                    )
                chunk_retry_count = 0  # reset retries on successful progress
            except HttpError as http_err:
                if http_err.resp.status in [500, 502, 503, 504]:
                    chunk_retry_count += 1
                    if chunk_retry_count > max_chunk_retries:
                        print(f"[YouTube Upload ERROR] Max retries ({max_chunk_retries}) exhausted on HTTP {http_err.resp.status} server error.")
                        raise
                    sleep_time = retry_delay * (2 ** (chunk_retry_count - 1))
                    print(
                        f"[YouTube Upload WARN] Transient YouTube server error HTTP {http_err.resp.status} ({http_err.resp.reason}). "
                        f"Retrying in {sleep_time:.1f}s (Attempt {chunk_retry_count}/{max_chunk_retries})..."
                    )
                    time.sleep(sleep_time)
                else:
                    raw_content = http_err.content.decode('utf-8', errors='replace') if isinstance(http_err.content, bytes) else str(http_err.content)
                    print(f"[YouTube Upload ERROR] Non-retryable HTTP {http_err.resp.status} API Error: {raw_content}")
                    raise
            except (socket.timeout, socket.error, http.client.RemoteDisconnected, TimeoutError, ConnectionResetError) as net_err:
                chunk_retry_count += 1
                if chunk_retry_count > max_chunk_retries:
                    print(f"[YouTube Upload ERROR] Max retries ({max_chunk_retries}) exhausted on network glitch: {net_err}")
                    raise
                sleep_time = retry_delay * (2 ** (chunk_retry_count - 1))
                print(
                    f"[YouTube Upload WARN] Network timeout/glitch ({type(net_err).__name__}: {net_err}). "
                    f"Retrying in {sleep_time:.1f}s (Attempt {chunk_retry_count}/{max_chunk_retries})..."
                )
                time.sleep(sleep_time)

        youtube_video_id = response.get("id") if response else None
        if youtube_video_id:
            watch_url = f"https://www.youtube.com/watch?v={youtube_video_id}" if is_long else f"https://www.youtube.com/shorts/{youtube_video_id}"
            print("=" * 75)
            print(f"[YouTube Upload SUCCESS] Successfully published {format_label} to YouTube!")
            print(f"  Video ID: {youtube_video_id}")
            print(f"  Live URL: {watch_url}")
            print(f"  Title: {upload_title}")
            print(f"  Size: {file_size_mb:.2f} MB | Duration: {video_duration:.2f}s")
            print("=" * 75)
            return YouTubeUploadResult(
                youtube_video_id,
                success=True,
                youtube_url=watch_url,
                title=upload_title,
                format="long" if is_long else "short",
                is_simulated=False
            )
        else:
            raise RuntimeError(f"YouTube API responded without a valid video id: {response}")

    except Exception as e:
        err_stack = traceback.format_exc()
        print("\n" + "=" * 80)
        print(f"[YouTube Upload EXCEPTION] Critical failure during {format_label} upload:")
        print(f"  Title: '{title}'")
        print(f"  Target File: {v_path.resolve() if v_path.exists() else video_path}")
        print(f"  File Size: {file_size:,} bytes ({file_size_mb:.2f} MB)")
        print(f"  Duration: {video_duration:.2f}s")
        print(f"  Format: {video_format} (is_long={is_long})")
        print(f"  Exception Type: {type(e).__name__}")
        print(f"  Exception Message: {e}")
        if isinstance(e, HttpError):
            print(f"  API HTTP Status: {e.resp.status}")
            print(f"  API HTTP Reason: {e.resp.reason}")
            try:
                content_str = e.content.decode('utf-8', errors='replace') if isinstance(e.content, bytes) else str(e.content)
                print(f"  API Response Body: {content_str}")
            except Exception:
                pass
        print("----- EXACT ERROR STACK TRACE -----")
        print(err_stack)
        print("=" * 80 + "\n")
        raise RuntimeError(f"YouTube Data API upload failed: {e}\n{err_stack}") from e


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
    Prints exact error stack trace if upload hits a timeout or API exception.
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
Subscribe to GlobalPulse AI on YouTube (@GloblePulseAi) for cutting-edge AI, geopolitical insights, global sports, and markets:
👉 https://www.youtube.com/@GloblePulseAi

#{category.replace(' ', '').replace('&', '')} #News #GlobalMarkets #Technology #GlobalPulseAI #GloblePulseAi #WorldNews #IntelligenceBriefing
"""

    tags = ["GlobalPulse AI", "GloblePulseAi", category, "Breaking News", "World News", "Technology", "Markets", "Documentary"]
    cat_id = get_category_id(category)

    try:
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
    except Exception as e:
        print(f"[YouTube Long Video Upload FAILED] Failed uploading long video '{title}' for slug '{slug}': {e}")
        print(traceback.format_exc())
        raise


def generate_viral_youtube_tags(title: str, category: str) -> List[str]:
    """Generates 12-16 high-ranking, topic-specific SEO tags for YouTube Shorts."""
    import re
    base_tags = ["GlobalPulse AI", "Shorts", "Trending", "Viral", "News"]
    
    # Extract significant keywords from headline (e.g. Nvidia, Tesla, Grok, Apple, F1)
    clean_words = [w.capitalize() for w in re.sub(r'[^a-zA-Z0-9\s]', ' ', title).split() if len(w) > 3 and w.lower() not in {"this", "that", "with", "from", "have", "been", "says", "said", "will", "what"}]
    
    category_tags = {
        "Global Sports": ["Sports News", "Highlights", "Football", "Soccer", "F1", "Formula 1", "Premier League", "Champions League", "Cricket"],
        "AI & Tech": ["Artificial Intelligence", "AI News", "Tech News", "Technology", "Future Tech", "Silicon Valley", "Innovation", "Robotics"],
        "Global Markets": ["Stock Market", "Economy", "Finance", "Crypto", "Wall Street", "Investing", "Trading", "Global Economy"],
        "Geopolitics": ["World News", "Breaking News", "Geopolitics", "Global Affairs", "Diplomacy", "International Relations"],
        "Future Science": ["Science", "Space", "NASA", "Astronomy", "Deep Space", "Innovation", "Physics", "Quantum"]
    }
    
    cat_specific = category_tags.get(category, ["World News", "Technology"])
    combined = base_tags + clean_words[:7] + cat_specific + [category]
    
    seen = set()
    result = []
    for tag in combined:
        tag_clean = tag.strip()
        if tag_clean and tag_clean.lower() not in seen and len(tag_clean) < 30:
            seen.add(tag_clean.lower())
            result.append(tag_clean)
    return result[:18]


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

    description = f"""⚡ {title}

{clean_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Read Full Detailed Investigation on GlobalPulse AI:
👉 {website_url}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔔 Subscribe to @GloblePulseAi for daily 60-second global intelligence briefings!
Daily AI breakthroughs, financial markets, geopolitics & sports highlights.

#GlobalPulseAI #News #Shorts #viral #trending #{category.replace(' ', '').replace('&', '')}
"""

    tags = generate_viral_youtube_tags(title, category)
    cat_id = get_category_id(category)

    # Viral hook formatting with category specific hashtags
    cat_tag = {
        "AI & Tech": "#AI #Tech",
        "Global Sports": "#Sports #Football",
        "Global Markets": "#Finance #Crypto",
        "Geopolitics": "#WorldNews",
        "Future Science": "#Science #Space"
    }.get(category, "#News")

    clean_t = re.sub(r"(?i)\s*#shorts\b", "", title).strip()
    formatted_title = f"{clean_t} #shorts {cat_tag}"[:100]

    result = upload_video_to_youtube(
        video_path=video_filepath,
        title=formatted_title,
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


def delete_video_from_youtube(video_id: str) -> bool:
    """
    Deletes a video from the YouTube channel via YouTube Data API v3.
    Requires 'https://www.googleapis.com/auth/youtube' scope.
    """
    if not video_id or video_id == "dQw4w9WgXcQ":
        return False
    try:
        service = get_authenticated_service()
        service.videos().delete(id=video_id).execute()
        print(f"[YouTube Delete SUCCESS] Successfully deleted video ID: {video_id}")
        return True
    except Exception as e:
        print(f"[YouTube Delete ERROR] Could not delete video {video_id}: {e}")
        return False
