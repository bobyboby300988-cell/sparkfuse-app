/**
 * Agora engine singleton — only one RtcEngine can exist at a time on native.
 * All screens (go-live, live viewer, call) must use acquireAgoraEngine() and
 * releaseAgoraEngine() instead of calling createAgoraRtcEngine() directly.
 */

let _engine: any = null;

export function acquireAgoraEngine(
  AgoraModule: any,
  appId: string,
  channelProfile: any,
): any {
  // Release any lingering engine from a previous screen
  if (_engine) {
    try { _engine.leaveChannel(); } catch {}
    try { _engine.release(); } catch {}
    _engine = null;
  }
  const eng = AgoraModule.createAgoraRtcEngine();
  eng.initialize({ appId, channelProfile });
  _engine = eng;
  return eng;
}

export function releaseAgoraEngine(): void {
  if (_engine) {
    try { _engine.leaveChannel(); } catch {}
    try { _engine.release(); } catch {}
    _engine = null;
  }
}
