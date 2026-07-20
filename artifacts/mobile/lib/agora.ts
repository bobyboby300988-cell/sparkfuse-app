import { getApiUrl } from "./api";

export const AGORA_APP_ID = process.env["EXPO_PUBLIC_AGORA_APP_ID"] ?? "";

export function makeLiveChannel(sessionId: string) {
  return `live-${sessionId}`;
}
export function makeCallChannel(callId: string) {
  return `call-${callId}`;
}

export async function fetchAgoraToken(opts: {
  channelName: string;
  uid?: number;
  role?: "publisher" | "subscriber";
  getToken: () => Promise<string | null>;
}): Promise<{ token: string; appId: string; uid: number }> {
  const { channelName, uid = 0, role = "publisher", getToken } = opts;
  const authToken = await getToken();
  const res = await fetch(`${getApiUrl()}/api/agora/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ channelName, uid, role }),
  });
  if (!res.ok) throw new Error("Could not get stream token");
  return res.json() as Promise<{ token: string; appId: string; uid: number }>;
}
