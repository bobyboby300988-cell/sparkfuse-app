import { Router, type IRouter } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger';

const router: IRouter = Router();

interface LiveSession {
  id: string;
  name: string;
  category: string;
  roomUrl: string;
  roomName: string;
  startedAt: number;
  lastHeartbeat: number;
}

// In-memory registry of who is currently broadcasting. Live sessions are
// short-lived and ephemeral by nature, so we don't need durable storage —
// a stale entry (no heartbeat in STALE_MS) is treated as ended.
const sessions = new Map<string, LiveSession>();
const STALE_MS = 45_000;

function pruneStale() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastHeartbeat > STALE_MS) sessions.delete(id);
  }
}

router.post('/live/start', (req, res) => {
  const { name, category, roomUrl, roomName } = req.body as {
    name?: string;
    category?: string;
    roomUrl?: string;
    roomName?: string;
  };

  if (!name || !roomUrl || !roomName) {
    return res.status(400).json({ error: 'name, roomUrl and roomName are required' });
  }

  const id = randomUUID();
  const now = Date.now();
  sessions.set(id, {
    id,
    name,
    category: category ?? 'Dating',
    roomUrl,
    roomName,
    startedAt: now,
    lastHeartbeat: now,
  });

  logger.info({ id, name }, 'Live session started');
  return res.json({ id });
});

router.post('/live/:id/heartbeat', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Live session not found' });
  session.lastHeartbeat = Date.now();
  return res.json({ ok: true });
});

router.post('/live/:id/end', (req, res) => {
  sessions.delete(req.params.id);
  res.json({ ok: true });
});

router.get('/live/active', (_req, res) => {
  pruneStale();
  res.json({ sessions: Array.from(sessions.values()) });
});

router.get('/live/:id', (req, res) => {
  pruneStale();
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Live session not found' });
  return res.json(session);
});

export default router;
