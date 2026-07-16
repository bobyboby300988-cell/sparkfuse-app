import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

interface InAppCallProps {
  roomUrl: string;
  isVideo: boolean;
  calleeName: string;
  onEnd: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: Record<string, unknown>
    ) => { dispose: () => void; addListener: (event: string, cb: () => void) => void };
  }
}

let scriptLoaded = false;
let scriptLoading = false;
const scriptCallbacks: Array<() => void> = [];

function loadJitsiScript(cb: () => void) {
  if (scriptLoaded) { cb(); return; }
  scriptCallbacks.push(cb);
  if (scriptLoading) return;
  scriptLoading = true;
  const s = document.createElement("script");
  s.src = "https://meet.jit.si/external_api.js";
  s.async = true;
  s.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
    scriptCallbacks.forEach((fn) => fn());
    scriptCallbacks.length = 0;
  };
  document.head.appendChild(s);
}

export function openInAppCall(roomUrl: string, isVideo: boolean, onEnd?: () => void) {
  if (Platform.OS !== "web") return;

  const url = new URL(roomUrl);
  const domain = url.hostname;
  const roomName = url.pathname.replace("/", "");

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: #000; display: flex; flex-direction: column;
  `;

  const container = document.createElement("div");
  container.style.cssText = "flex: 1; width: 100%; height: 100%;";
  overlay.appendChild(container);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  let api: { dispose: () => void; addListener: (e: string, cb: () => void) => void } | null = null;

  const cleanup = () => {
    try { api?.dispose(); } catch {}
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
    document.body.style.overflow = "";
    onEnd?.();
  };

  loadJitsiScript(() => {
    if (!document.body.contains(overlay)) return;
    try {
      api = new window.JitsiMeetExternalAPI(domain, {
        roomName,
        width: "100%",
        height: "100%",
        parentNode: container,
        configOverwrite: {
          startWithVideoMuted: !isVideo,
          startWithAudioMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          disableThirdPartyRequests: false,
          enableNoisyMicDetection: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "hangup",
            "tileview",
            ...(isVideo ? ["fullscreen"] : []),
          ],
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
        userInfo: { displayName: "SparkFuse" },
      });
      api.addListener("readyToClose", cleanup);
      api.addListener("videoConferenceLeft", cleanup);
    } catch {
      cleanup();
    }
  });
}

export default function InAppCall(_props: InAppCallProps) {
  return null;
}
