import { Router, type IRouter } from 'express';
import { eq, and, gt, or } from 'drizzle-orm';
import { db } from '@workspace/db';
import { usersTable, callsTable } from '@workspace/db';
import { requireAuth } from '../middlewares/requireAuth';
import { logger } from '../lib/logger';
import { buildAgoraToken, isAgoraConfigured } from '../lib/agoraToken';

const router: IRouter = Router();

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
  const userId = req.dbUser!.id;
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: 'token required' });
  await db.update(usersTable).set({ pushToken: token }).where(eq(usersTable.id, userId));
  return res.json({ ok: true });
});

// POST /api/calls/initiate — caller starts a call; creates Agora channel + notifies callee
router.post('/calls/initiate', requireAuth, async (req, res) => {
  if (!isAgoraConfigured()) return res.status(503).json({ error: 'Calls not configured' });
  const callerId = req.dbUser!.id;
  const { calleeId, isVoice = false, callerName = 'User', callerPhoto = '' } = req.body as {
    calleeId?: string; isVoice?: boolean; callerName?: string; callerPhoto?: string;
  };
  if (!calleeId) return res.status(400).json({ error: 'calleeId required' });

  const channelName = `call-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  let callerToken: string;
  let appId: string;
  try {
    const result = buildAgoraToken(channelName, 0, 'publisher');
    callerToken = result.token;
    appId = result.appId;
  } catch (err) {
    logger.error({ err }, 'Failed to build Agora token');
    return res.status(500).json({ error: 'Could not create call' });
  }

  const [call] = await db.insert(callsTable).values({
    callerId, calleeId,
    roomUrl: channelName,
    callerToken,
    isVoice, callerName, callerPhoto, status: 'pending',
  }).returning();

  const [callee] = await db.select({ pushToken: usersTable.pushToken, notifCalls: usersTable.notifCalls })
    .from(usersTable).where(eq(usersTable.id, calleeId));
  if (callee?.pushToken && callee.notifCalls !== false) {
    await sendPush(
      callee.pushToken,
      isVoice ? '📞 Voice Call' : '📹 Video Call',
      `${callerName} is calling you`,
      { type: 'incoming_call', callId: call.id, callerId, callerName, callerPhoto, channelName, isVoice: String(isVoice) },
    );
  }

  return res.json({ callId: call.id, channelName, appId, token: callerToken });
});

// GET /api/calls/incoming — callee polls for pending calls
router.get('/calls/incoming', requireAuth, async (req, res) => {
  const userId = req.dbUser!.id;
  const since = new Date(Date.now() - 60_000);
  const rows = await db.select({
    id: callsTable.id,
    callerId: callsTable.callerId,
    callerName: callsTable.callerName,
    callerPhoto: callsTable.callerPhoto,
    channelName: callsTable.roomUrl,
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
  if (!isAgoraConfigured()) return res.status(503).json({ error: 'Calls not configured' });
  const userId = req.dbUser!.id;
  const { callId, accept } = req.body as { callId?: string; accept?: boolean };
  if (!callId) return res.status(400).json({ error: 'callId required' });

  const [call] = await db.select().from(callsTable)
    .where(and(eq(callsTable.id, callId), eq(callsTable.calleeId, userId)));
  if (!call) return res.status(404).json({ error: 'Call not found' });

  if (!accept) {
    await db.update(callsTable).set({ status: 'declined' }).where(eq(callsTable.id, callId));
    return res.json({ ok: true });
  }

  let calleeToken: string;
  let appId: string;
  try {
    const result = buildAgoraToken(call.roomUrl, 0, 'publisher');
    calleeToken = result.token;
    appId = result.appId;
  } catch {
    return res.status(500).json({ error: 'Could not create call token' });
  }
  await db.update(callsTable).set({ status: 'accepted' }).where(eq(callsTable.id, callId));
  return res.json({ channelName: call.roomUrl, appId, token: calleeToken, isVoice: call.isVoice });
});

// POST /api/calls/end
router.post('/calls/end', requireAuth, async (req, res) => {
  const userId = req.dbUser!.id;
  const { callId } = req.body as { callId?: string };
  if (!callId) return res.status(400).json({ error: 'callId required' });
  await db.update(callsTable).set({ status: 'ended' })
    .where(and(eq(callsTable.id, callId), or(eq(callsTable.callerId, userId), eq(callsTable.calleeId, userId))));
  return res.json({ ok: true });
});

// POST /api/calls/demo-channel — generate Agora token for demo profiles (no DB insert needed)
router.post('/calls/demo-channel', requireAuth, async (req, res) => {
  if (!isAgoraConfigured()) return res.status(503).json({ error: 'Calls not configured' });
  const channelName = `demo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  try {
    const { token, appId } = buildAgoraToken(channelName, 0, 'publisher');
    return res.json({ callId: 'demo', channelName, appId, token });
  } catch (err) {
    logger.error({ err }, 'Failed to build demo Agora token');
    return res.status(500).json({ error: 'Could not create call' });
  }
});

// POST /api/calls/token — join an existing channel by channelName (for chat "Answer" button)
router.post('/calls/token', requireAuth, async (req, res) => {
  if (!isAgoraConfigured()) return res.status(503).json({ error: 'Calls not configured' });
  const { channelName } = req.body as { channelName?: string };
  if (!channelName) return res.status(400).json({ error: 'channelName required' });
  try {
    const { token, appId } = buildAgoraToken(channelName, 0, 'publisher');
    return res.json({ token, appId, channelName });
  } catch (err) {
    return res.status(500).json({ error: 'Could not create token' });
  }
});

export default router;
