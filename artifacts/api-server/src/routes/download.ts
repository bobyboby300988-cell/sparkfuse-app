import { Router, type IRouter } from 'express';
import { logger } from '../lib/logger';
import { Readable } from 'node:stream';

const router: IRouter = Router();

const APK_URL =
  'https://expo.dev/artifacts/eas/pX-p7jQ6p_mRwCZw1yOValjacJvWSKXl4crJxTloqNQ.apk';

router.get('/download/apk', async (_req, res) => {
  try {
    const upstream = await fetch(APK_URL);
    if (!upstream.ok) {
      res.status(502).json({ error: 'APK temporarily unavailable' });
      return;
    }
    res.setHeader('Content-Disposition', 'attachment; filename="SparkFuse App.apk"');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    const len = upstream.headers.get('content-length');
    if (len) res.setHeader('Content-Length', len);
    // @ts-ignore — upstream.body is a Web ReadableStream
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err: any) {
    logger.error({ err }, 'APK download proxy failed');
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
