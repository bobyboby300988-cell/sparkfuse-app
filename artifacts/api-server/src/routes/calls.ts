import { Router, type IRouter } from 'express';
import { eq, and, gt, or } from 'drizzle-orm';
import { db } from '@workspace/db';
import { usersTable, callsTable } from '@workspace/db';
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

async function getOrCreateDailyRoom(roomId: string): Promise<string> {
  const clean = roomId.replace(/[^a-zA-Z0-9-]/g, '-');
  const safeName = clean.startsWith('spark-') ? clean.slice(0, 60) : `spark-${clean.slice(0, 54)}`;
  const getRes = await dailyFetch(`/rooms/${safeName}`);
  if (getRes.ok) {
    const room = (await getRes.json()) as { url: string };
    return room.url;
  }
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
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
    }),
  });
  if (!createRes.ok) throw new Error('Could not create Daily room');
  const room = (await createRes.json()) as { url: string };
  return room.url;
}

async function createDailyToken(roomUrl: string, isOwner: boolean, userName: string, videoOff = false): Promise<string> {
  const roomName = roomUrl.replace(/\?.*$/, '').split('/').pop() ?? '';
  const tokenRes = await dailyFetch('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        user_name: userName,
        start_video_off: videoOff,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
      },
    }),
  });
  if (!tokenRes.ok) throw new Error('Could not create Daily token');
  const { token } = (await tokenRes.json()) as { token: string };
  return token;
}

async function sendPush(pushToken: string, title: string, body: string, data: Record<string, string>) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, data, sound: 'default', priority: 'high', ttl: 60 }),
    });
  } catch (err) {
    logger.warn({ err }, 'Push notification failed');
  }
}

// POST /api/calls/push-token
router.post('/calls/push-token', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: 'token required' });
  await db.update(usersTable).set({ pushToken: token }).where(eq(usersTable.id, userId));
  return res.json({ ok: true });
});

// POST /api/calls/initiate — caller starts a call
router.post('/calls/initiate', requireAuth, async (req, res) => {
  if (!DAILY_API_KEY) return res.status(503).json({ error: 'Calls not configured' });
  const callerId = (req as any).userId as string;
  const { calleeId, isVoice = false, callerName = 'User', callerPhoto = '' } = req.body as {
    calleeId?: string; isVoice?: boolean; callerName?: string; callerPhoto?: string;
  };
  if (!calleeId) return res.status(400).json({ error: 'calleeId required' });

  const roomId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  let roomUrl: string;
  let callerToken: string;
  try {
    roomUrl = await getOrCreateDailyRoom(roomId);
    callerToken = await createDailyToken(roomUrl, true, callerName, isVoice);
  } catch (err) {
    logger.error({ err }, 'Failed to create Daily room');
    return res.status(500).json({ error: 'Could not create call room' });
  }

  const [call] = await db.insert(callsTable).values({
    callerId, calleeId, roomUrl, callerToken, isVoice, callerName, callerPhoto, status: 'pending',
  }).returning();

  const [callee] = await db.select({ pushToken: usersTable.pushToken, notifCalls: usersTable.notifCalls }).from(usersTable).where(eq(usersTable.id, calleeId));
  if (callee?.pushToken && callee.notifCalls !== false) {
    await sendPush(
      callee.pushToken,
      isVoice ? '📞 Apel vocal' : '📹 Apel video',
      `${callerName} te sună`,
      { type: 'incoming_call', callId: call.id, callerId, callerName, callerPhoto, roomUrl, isVoice: String(isVoice) },
    );
  }

  return res.json({ callId: call.id, roomUrl, token: callerToken });
});

// GET /api/calls/incoming — callee polls for pending calls
router.get('/calls/incoming', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const since = new Date(Date.now() - 60_000);
  const rows = await db.select({
    id: callsTable.id,
    callerId: callsTable.callerId,
    callerName: callsTable.callerName,
    callerPhoto: callsTable.callerPhoto,
    roomUrl: callsTable.roomUrl,
    isVoice: callsTable.isVoice,
    status: callsTable.status,
  })
    .from(callsTable)
    .where(and(eq(callsTable.calleeId, userId), eq(callsTable.status, 'pending'), gt(callsTable.createdAt, since)))
    .limit(1);
  return res.json({ call: rows[0] ?? null });
});

// POST /api/calls/respond — callee accepts or declines
router.post('/calls/respond', requireAuth, async (req, res) => {
  if (!DAILY_API_KEY) return res.status(503).json({ error: 'Calls not configured' });
  const userId = (req as any).userId as string;
  const { callId, accept, calleeName = 'User' } = req.body as { callId?: string; accept?: boolean; calleeName?: string };
  if (!callId) return res.status(400).json({ error: 'callId required' });

  const [call] = await db.select().from(callsTable).where(and(eq(callsTable.id, callId), eq(callsTable.calleeId, userId)));
  if (!call) return res.status(404).json({ error: 'Call not found' });

  if (!accept) {
    await db.update(callsTable).set({ status: 'declined' }).where(eq(callsTable.id, callId));
    return res.json({ ok: true });
  }

  let calleeToken: string;
  try {
    calleeToken = await createDailyToken(call.roomUrl, false, calleeName);
  } catch {
    return res.status(500).json({ error: 'Could not create call token' });
  }
  await db.update(callsTable).set({ status: 'accepted' }).where(eq(callsTable.id, callId));
  return res.json({ roomUrl: call.roomUrl, token: calleeToken, isVoice: call.isVoice });
});

// POST /api/calls/end
router.post('/calls/end', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { callId } = req.body as { callId?: string };
  if (!callId) return res.status(400).json({ error: 'callId required' });
  await db.update(callsTable).set({ status: 'ended' })
    .where(and(eq(callsTable.id, callId), or(eq(callsTable.callerId, userId), eq(callsTable.calleeId, userId))));
  return res.json({ ok: true });
});

// POST /api/calls/room — legacy backward compat
router.post('/calls/room', requireAuth, async (req, res) => {
  if (!DAILY_API_KEY) return res.status(503).json({ error: 'Video calls not configured' });
  const { roomName, isOwner = true, userName = 'User', videoOff = false } = req.body as {
    roomName?: string; isOwner?: boolean; userName?: string; videoOff?: boolean;
  };
  if (!roomName || typeof roomName !== 'string') return res.status(400).json({ error: 'roomName is required' });
  try {
    const roomUrl = await getOrCreateDailyRoom(roomName);
    const token = await createDailyToken(roomUrl, isOwner, userName, videoOff);
    return res.json({ roomUrl, token });
  } catch (err) {
    logger.error({ err }, 'Failed to create Daily room');
    return res.status(500).json({ error: 'Could not create call room' });
  }
});

export default router;
