import { getApiUrl } from "@/lib/api";
const API_BASE = `${getApiUrl()}/api`;

export interface LiveSession {
  id: string;
  name: string;
  category: string;
  channelName: string;
  hostUserId?: string;
  startedAt: number;
  lastHeartbeat: number;
}

export async function createBroadcast(opts: {
  name: string;
  category: string;
  hostUserId?: string;
  hostName?: string;
}): Promise<{ sessionId: string; channelName: string; appId: string; token: string }> {
  const res = await fetch(`${API_BASE}/live/create-broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not start live broadcast");
  }
  return res.json() as Promise<{ sessionId: string; channelName: string; appId: string; token: string }>;
}

export async function fetchViewerToken(sessionId: string): Promise<{ token: string; channelName: string; appId: string }> {
  const res = await fetch(`${API_BASE}/live/${sessionId}/viewer-token`, { method: "POST" });
  if (!res.ok) throw new Error("Could not get viewer token");
  return res.json() as Promise<{ token: string; channelName: string; appId: string }>;
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
