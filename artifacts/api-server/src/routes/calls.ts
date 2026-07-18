import { Router, type IRouter } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { logger } from '../lib/logger';

const router: IRouter = Router();

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_BASE = 'https://api.daily.co/v1';

async function dailyFetch(path: string, init?: RequestInit) {
  return fetch(`${DAILY_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

// POST /api/calls/room
// Creates or fetches a Daily room and issues a meeting token for the caller.
// Body: { roomName: string, isOwner?: boolean, userName?: string, videoOff?: boolean }
// Returns: { roomUrl: string, token: string }
router.post('/calls/room', requireAuth, async (req, res) => {
  if (!DAILY_API_KEY) {
    return res.status(503).json({ error: 'Video calls not configured' });
  }

  const { roomName, isOwner = true, userName = 'User', videoOff = false } = req.body as {
    roomName?: string;
    isOwner?: boolean;
    userName?: string;
    videoOff?: boolean;
  };

  if (!roomName || typeof roomName !== 'string') {
    return res.status(400).json({ error: 'roomName is required' });
  }

  // Avoid double-prefixing: callee extracts the full room name (already "spark-xyz")
  // from the roomUrl sent in the chat message, so don't prepend again.
  const clean = roomName.replace(/[^a-zA-Z0-9-]/g, '-');
  const safeName = clean.startsWith('spark-') ? clean.slice(0, 60) : `spark-${clean.slice(0, 54)}`;

  // Get or create the room
  let roomUrl: string;
  const getRes = await dailyFetch(`/rooms/${safeName}`);
  if (getRes.ok) {
    const room = (await getRes.json()) as { url: string };
    roomUrl = room.url;
  } else {
    const createRes = await dailyFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name: safeName,
        properties: {
          enable_chat: false,
          enable_knocking: false,
          enable_prejoin_ui: false,
          start_video_off: false,
          start_audio_off: false,
          // Room expires after 24 hours of inactivity
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      logger.error({ err }, 'Failed to create Daily room');
      return res.status(500).json({ error: 'Could not create call room' });
    }
    const room = (await createRes.json()) as { url: string };
    roomUrl = room.url;
  }

  // Issue a meeting token (expires in 6 hours)
  const tokenRes = await dailyFetch('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: safeName,
        is_owner: isOwner,
        user_name: userName,
        start_video_off: videoOff,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
      },
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    logger.error({ err }, 'Failed to create Daily token');
    return res.status(500).json({ error: 'Could not create call token' });
  }

  const { token } = (await tokenRes.json()) as { token: string };
  return res.json({ roomUrl, token });
});

export default router;
