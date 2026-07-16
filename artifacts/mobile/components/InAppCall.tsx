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

export function openInAppCall(roomUrl: string, _isVideo: boolean, _onEnd?: () => void) {
  if (Platform.OS !== "web") return;
  // Open the Jitsi room directly in a new tab — most reliable on web browsers.
  // Both caller and recipient join the same named room this way.
  window.open(roomUrl, "_blank", "noopener,noreferrer");
}

export default function InAppCall(_props: InAppCallProps) {
  return null;
}
