---
name: Live video broadcast architecture
description: How real (non-mocked) camera live-streaming is implemented in the Spark dating app, and why key tradeoffs were made this way.
---

Real live broadcasting (as opposed to the earlier fully-mocked "Live" tab) reuses the existing Daily.co WebRTC integration (already used for 1:1 video calls) instead of introducing a new streaming stack.

- Broadcaster joins a Daily room with an owner meeting token (camera/mic on); viewers join the same room with a non-owner token (camera/mic forced off) so only the host is seen/heard — this turns a 1:1 video-call primitive into a one-to-many broadcast without SFU/RTMP infrastructure.
- Live session bookkeeping (who's live, room URL, category, viewer-facing metadata) is an in-memory Map on the API server with heartbeat-based expiry (client pings every ~15s, server prunes entries with no heartbeat in 45s). No DB table was added.
  - **Why:** sessions are inherently ephemeral (tied to an active process/socket), and the rest of the app's live-related data (LIVE_STREAMS, chat) is already mock/demo data — adding durable persistence for this piece would be inconsistent effort for no real benefit.
  - **How to apply:** if live sessions ever need to survive server restarts, span multiple API instances, or be queried historically, replace the in-memory Map with a real table — don't just extend the Map further.
- The Daily API key is used directly from the client (`EXPO_PUBLIC_DAILY_API_KEY`), matching the pre-existing 1:1 call feature's pattern. This is a known/accepted insecure pattern kept for consistency rather than fixed as part of this feature — revisit both call sites together if tightening this later.
