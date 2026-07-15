import { API_BASE } from "@/config/payments";

export interface LiveSession {
  id: string;
  name: string;
  category: string;
  roomUrl: string;
  roomName: string;
  hostUserId?: string;
  startedAt: number;
  lastHeartbeat: number;
}

export async function startLiveSession(opts: {
  name: string;
  category: string;
  roomUrl: string;
  roomName: string;
  hostUserId?: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/live/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error("Could not start live session");
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function heartbeatLiveSession(id: string): Promise<void> {
  await fetch(`${API_BASE}/live/${id}/heartbeat`, { method: "POST" }).catch(() => {});
}

export async function endLiveSession(id: string): Promise<void> {
  await fetch(`${API_BASE}/live/${id}/end`, { method: "POST" }).catch(() => {});
}

export async function fetchActiveLiveSessions(): Promise<LiveSession[]> {
  const res = await fetch(`${API_BASE}/live/active`);
  if (!res.ok) return [];
  const data = (await res.json()) as { sessions: LiveSession[] };
  return data.sessions;
}

export async function fetchLiveSession(id: string): Promise<LiveSession | null> {
  const res = await fetch(`${API_BASE}/live/${id}`);
  if (!res.ok) return null;
  return (await res.json()) as LiveSession;
}
