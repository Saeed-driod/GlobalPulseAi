// Vercel Serverless Function for D-ID AI News Anchor Video Generation
const fs = require('fs');
const path = require('path');

function getDidApiKey() {
  let key = process.env.DID_API_KEY || process.env.NEXT_PUBLIC_DID_API_KEY || '';
  if (!key) {
    try {
      const candidates = [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'frontend', '.env.local'),
        path.resolve(process.cwd(), 'frontend', '.env'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          const content = fs.readFileSync(c, 'utf-8');
          const m = content.match(/DID_API_KEY\s*=\s*(.+)/);
          if (m && m[1]) {
            key = m[1].trim().replace(/^["']|["']$/g, '');
            break;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return key;
}

const ANCHOR_IMAGE_URLS = {
  female: 'https://globalpulseai.vercel.app/assets/anchors/anchor_female_sarah.jpg',
  male: 'https://globalpulseai.vercel.app/assets/anchors/anchor_male_david.jpg',
};

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = getDidApiKey();
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_API_KEY',
      error: 'D-ID API Key not configured. Please set DID_API_KEY in environment variables.',
    });
  }

  const authHeader = apiKey.startsWith('Basic ') ? apiKey : `Basic ${apiKey}`;

  // 1. POST /api/generate-anchor: Create new D-ID talk
  if (req.method === 'POST') {
    try {
      const { scriptText, presenterGender = 'female', customImageUrl } = req.body || {};

      if (!scriptText || typeof scriptText !== 'string' || scriptText.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: 'A valid scriptText (at least 5 characters) is required to generate the talking anchor.',
        });
      }

      const isFemale = presenterGender.toLowerCase().includes('female') || presenterGender.toLowerCase() === 'sarah';
      const sourceUrl = customImageUrl || (isFemale ? ANCHOR_IMAGE_URLS.female : ANCHOR_IMAGE_URLS.male);
      const voiceId = isFemale ? 'en-US-JennyNeural' : 'en-US-GuyNeural';

      const cleanScript = scriptText.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();

      const payload = {
        source_url: sourceUrl,
        script: {
          type: 'text',
          subtitles: false,
          provider: {
            type: 'microsoft',
            voice_id: voiceId,
          },
          input: cleanScript,
        },
        config: {
          fluent: true,
          pad_audio: 0.0,
        },
      };

      const response = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 402 || data?.kind === 'InsufficientCreditsError') {
          return res.status(402).json({
            success: false,
            code: 'INSUFFICIENT_CREDITS',
            error: 'D-ID API: Insufficient credits remaining on account (0 credits). You can recharge at studio.d-id.com or continue using the 100% Free Built-in Studio Presenter Mode.',
            details: data,
          });
        }
        return res.status(response.status).json({
          success: false,
          code: data?.kind || 'DID_API_ERROR',
          error: data?.description || data?.message || `D-ID API returned status ${response.status}`,
          details: data,
        });
      }

      return res.status(200).json({
        success: true,
        id: data.id,
        status: data.status,
        created_at: data.created_at,
        object: data.object,
        presenterGender: isFemale ? 'female' : 'male',
        voiceId,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to generate D-ID talking anchor video.',
      });
    }
  }

  // 2. GET /api/generate-anchor?id=<talkId>: Check talk status
  if (req.method === 'GET') {
    try {
      const talkId = req.query?.id;
      if (!talkId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query parameter: id',
        });
      }

      const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data?.description || data?.message || `Failed to fetch talk ${talkId}`,
        });
      }

      return res.status(200).json({
        success: true,
        id: data.id,
        status: data.status,
        result_url: data.result_url || null,
        duration: data.duration || null,
        error: data.error || null,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to check D-ID talk status.',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
