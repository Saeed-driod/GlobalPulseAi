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
When deploying the frontend to Vercel, configure the following server environment variable in your Vercel Project Settings (`Settings` > `Environment Variables`):

- `BACKEND_URL`: The origin URL of your backend server (e.g., `http://YOUR_SERVER_IP` or your custom domain). Next.js server-side route handlers and server components use this variable to securely communicate with the backend API without exposing the server IP or host in client browser bundles.

