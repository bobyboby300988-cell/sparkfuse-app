import { Router, type IRouter } from 'express';
import { logger } from '../lib/logger';
import { Readable } from 'node:stream';

const router: IRouter = Router();

const GITHUB_REPO = 'bobyboby300988-cell/sparkfuse-app';
const APK_ASSET_NAME = 'app-debug.apk';

const LATEST_APK_URL = `https://github.com/${GITHUB_REPO}/releases/latest/download/${APK_ASSET_NAME}`;

router.get('/download/apk', async (_req, res) => {
  try {
    const upstream = await fetch(LATEST_APK_URL, {
      headers: { 'User-Agent': 'SparkFuse-Server/1.0' },
      redirect: 'follow',
    });
    if (!upstream.ok) {
      logger.error({ status: upstream.status }, 'APK upstream fetch failed');
      res.status(502).json({ error: 'APK temporarily unavailable' });
      return;
    }
    res.setHeader('Content-Disposition', 'attachment; filename="SparkFuse.apk"');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    const len = upstream.headers.get('content-length');
    if (len) res.setHeader('Content-Length', len);
    // @ts-ignore
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err: any) {
    logger.error({ err }, 'APK download failed');
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
