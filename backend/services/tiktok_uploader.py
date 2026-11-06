"""
GlobalPulse AI - Official TikTok Content Posting API Service (v2)
Strictly adheres to TikTok's Dec 1, 2026 OAuth standards:
- 2-hour access token validity
- 180-day refresh token validity
- Automatic refresh token rotation (persisting the latest refresh token immediately)
- Direct video publishing & Creator Inbox fallback via chunked upload
"""
import os
import sys
import json
import time
import requests
from pathlib import Path
from typing import Dict, Any, Optional

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
TOKEN_FILE = BACKEND_DIR / "tiktok_token.json"

# Load environment
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY", "").strip()
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "").strip()

BASE_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
BASE_API_URL = "https://open.tiktokapis.com/v2"

def get_authorization_url(redirect_uri: str = "https://globalpulseai.vercel.app", state: str = "globalpulse_tiktok_auth") -> str:
    """Generates the official TikTok OAuth 2.0 authorization URL."""
    scopes = "user.info.profile,video.manage,video.list"
    params = {
        "client_key": TIKTOK_CLIENT_KEY,
        "scope": scopes,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "state": state
    }
    req = requests.Request("GET", BASE_AUTH_URL, params=params).prepare()
    return req.url

def save_token_data(data: Dict[str, Any]):
    """Saves token response and rotation timestamps to disk."""
    data["updated_at"] = int(time.time())
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def load_token_data() -> Optional[Dict[str, Any]]:
    """Loads stored TikTok token credentials."""
    if not TOKEN_FILE.exists():
        return None
    try:
        with open(TOKEN_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def exchange_code_for_tokens(code: str, redirect_uri: str = "https://globalpulseai.vercel.app") -> Dict[str, Any]:
    """Exchanges authorization code for initial access and refresh tokens."""
    url = f"{BASE_API_URL}/oauth/token/"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    payload = {
        "client_key": TIKTOK_CLIENT_KEY,
        "client_secret": TIKTOK_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri
    }
    
    resp = requests.post(url, data=payload, headers=headers, timeout=30)
    data = resp.json()
    
    if "access_token" in data:
        save_token_data(data)
        return {"success": True, "data": data}
    return {"success": False, "error": data}

def get_valid_access_token() -> Optional[str]:
    """
    Returns an active access token. If expired, refreshes it and automatically
    persists the newly rotated refresh token per TikTok's mandatory requirements.
    """
    tokens = load_token_data()
    if not tokens:
        return None
        
    updated_at = tokens.get("updated_at", 0)
    expires_in = tokens.get("expires_in", 7200) # 2 hours default
    
    # If token has >5 minutes remaining, reuse
    if (time.time() - updated_at) < (expires_in - 300):
        return tokens.get("access_token")
        
    # Refresh expired access token
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        return None
        
    print("[TikTok OAuth] Access token expired. Rotating and refreshing token...")
    url = f"{BASE_API_URL}/oauth/token/"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    payload = {
        "client_key": TIKTOK_CLIENT_KEY,
        "client_secret": TIKTOK_CLIENT_SECRET,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    
    try:
        resp = requests.post(url, data=payload, headers=headers, timeout=30)
        data = resp.json()
        if "access_token" in data:
            # Overwrite with newly rotated refresh token!
            tokens["access_token"] = data["access_token"]
            tokens["refresh_token"] = data.get("refresh_token", refresh_token)
            tokens["expires_in"] = data.get("expires_in", 7200)
            tokens["refresh_expires_in"] = data.get("refresh_expires_in", 15552000)
            save_token_data(tokens)
            print("[TikTok OAuth] Successfully rotated and saved fresh TikTok tokens.")
            return tokens["access_token"]
        else:
            print(f"[TikTok OAuth Error] Refresh failed: {data}")
            return None
    except Exception as e:
        print(f"[TikTok OAuth Error] Exception refreshing token: {e}")
        return None

def upload_video_to_tiktok(video_path: str, title: str, privacy_level: str = "PUBLIC_TO_EVERYONE") -> Dict[str, Any]:
    """
    Uploads a video to TikTok using the Content Posting API v2.
    Handles Direct Publishing with automatic fallback to Creator Inbox Draft.
    """
    p = Path(video_path)
    if not p.exists():
        return {"success": False, "error": f"Video file not found: {video_path}"}
        
    access_token = get_valid_access_token()
    if not access_token:
        return {"success": False, "error": "TikTok not authenticated or token expired. Please link account."}
        
    video_size = p.stat().st_size
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8"
    }
    
    # 1. Initialize Direct Publishing
    init_url = f"{BASE_API_URL}/post/publish/video/init/"
    init_payload = {
        "post_info": {
            "title": title[:150], # Max caption length
            "privacy_level": privacy_level,
            "disable_duet": False,
            "disable_stitch": False,
            "disable_comment": False,
            "video_cover_timestamp_ms": 1000
        },
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": video_size,
            "chunk_size": video_size,
            "total_chunk_count": 1
        }
    }
    
    print(f"[TikTok Uploader] Initializing upload for: {p.name} ({video_size / (1024*1024):.2f} MB)...")
    init_resp = requests.post(init_url, json=init_payload, headers=headers, timeout=30)
    init_data = init_resp.json()
    
    # Check for direct publish permissions, fallback to Inbox Draft if needed
    if init_data.get("error", {}).get("code") in ["unaudited_client_can_only_post_to_inbox", "scope_not_authorized"]:
        print("[TikTok Uploader] Direct post restricted to Inbox draft. Falling back to Creator Inbox...")
        init_url = f"{BASE_API_URL}/post/publish/inbox/video/init/"
        init_payload = {
            "source_info": {
                "source": "FILE_UPLOAD",
                "video_size": video_size,
                "chunk_size": video_size,
                "total_chunk_count": 1
            }
        }
        init_resp = requests.post(init_url, json=init_payload, headers=headers, timeout=30)
        init_data = init_resp.json()
        
    if "data" not in init_data or "upload_url" not in init_data["data"]:
        return {"success": False, "error": f"Failed to initialize TikTok upload: {init_data}"}
        
    publish_id = init_data["data"]["publish_id"]
    upload_url = init_data["data"]["upload_url"]
    
    # 2. Upload video bytes via PUT
    print("[TikTok Uploader] Uploading video binary stream...")
    upload_headers = {
        "Content-Type": "video/mp4",
        "Content-Range": f"bytes 0-{video_size - 1}/{video_size}"
    }
    
    with open(p, "rb") as vf:
        upload_resp = requests.put(upload_url, data=vf, headers=upload_headers, timeout=180)
        
    if upload_resp.status_code not in [200, 201]:
        return {"success": False, "error": f"TikTok chunk upload failed with HTTP {upload_resp.status_code}"}
        
    print(f"✔ [TikTok Uploader] Video uploaded successfully! Publish ID: {publish_id}")
    return {
        "success": True,
        "publish_id": publish_id,
        "status": "PROCESSING",
        "message": "Video uploaded to TikTok! Processing in channel feed / inbox."
    }
