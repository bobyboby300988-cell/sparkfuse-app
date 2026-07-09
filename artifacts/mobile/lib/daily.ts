const DAILY_API_KEY = process.env.EXPO_PUBLIC_DAILY_API_KEY;
const DAILY_API_URL = "https://api.daily.co/v1";

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export async function getOrCreateRoom(roomName: string): Promise<DailyRoom> {
  if (!DAILY_API_KEY) {
    throw new Error("EXPO_PUBLIC_DAILY_API_KEY is not set");
  }

  const safeName = `spark-${roomName.replace(/[^a-zA-Z0-9-]/g, "-")}`;

  const getRes = await fetch(`${DAILY_API_URL}/rooms/${safeName}`, {
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  });

  if (getRes.ok) {
    return getRes.json();
  }

  const createRes = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: safeName,
      properties: {
        enable_chat: true,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Daily room: ${err}`);
  }

  return createRes.json();
}

// Issues a meeting token that controls how a participant joins a room.
// Broadcasters (isOwner) join with camera/mic on; viewers join muted with
// their camera off so only the host is seen/heard, like a real live stream.
export async function createMeetingToken(
  roomName: string,
  opts: { isOwner: boolean; userName?: string }
): Promise<string> {
  if (!DAILY_API_KEY) {
    throw new Error("EXPO_PUBLIC_DAILY_API_KEY is not set");
  }

  const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: opts.isOwner,
        user_name: opts.userName ?? (opts.isOwner ? "Host" : "Viewer"),
        start_video_off: !opts.isOwner,
        start_audio_off: !opts.isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Daily meeting token: ${err}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}
