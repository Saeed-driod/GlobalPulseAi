---
title: GlobalPulse AI Backend
emoji: 🌐
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# GlobalPulse AI - Production Backend API
Autonomous AI Newsroom & Fast-Paced Video Production Backend powered by FastAPI and Google Gemini.

## Vercel Deployment Configuration
When deploying the frontend to Vercel, configure the following server environment variables in your Vercel Project Settings (`Settings` > `Environment Variables`):

- `BACKEND_URL`: The origin URL of your backend server (e.g., `http://YOUR_SERVER_IP` or your custom domain). Next.js server-side route handlers and server components use this variable to securely communicate with the backend API without exposing the server IP or host in client browser bundles.
- `ADMIN_SECRET_KEY`: Required master secret key (must match the backend's `ADMIN_SECRET_KEY`, minimum 16 characters). Used by serverless API routes (`/api/articles`, `/api/articles/[slug]`, `/api/articles/stats`, `/api/analytics/summary`) for constant-time cryptographic verification of administrative requests.
- `GEMINI_API_KEY`: Google Gemini API key used by the AI News Analyst (`/api/ai-analyst`) to generate instant structured takeaways and intelligence summaries.
- `GEMINI_MODEL`: (Optional) The Google Gemini model name to query for news synthesis. Defaults to `"gemini-flash-latest"` if omitted.

## Automated Video Retention & Disk Cleanup
The backend includes an automated cleanup job running every 6 hours via APScheduler (plus an initial run 2 minutes after startup) to prevent disk space exhaustion on cloud instances (e.g. Oracle VM):
- `VIDEO_RETENTION_DAYS`: (Optional) Number of days to retain generated video, audio, subtitle, and temporary render files in `<repo>/videos` and `backend/static/videos` before deletion. Defaults to `3`. Files referenced by in-flight or unuploaded articles are automatically protected until published.

