import { Router, type IRouter } from 'express';
import { logger } from '../lib/logger';

const router: IRouter = Router();

const GITHUB_REPO = 'bobyboby300988-cell/sparkfuse-app';
const APK_ASSET_NAME = 'app-debug.apk';

const LATEST_APK_URL = `https://github.com/${GITHUB_REPO}/releases/download/latest-apk/${APK_ASSET_NAME}`;

router.get('/download/apk', (_req, res) => {
  logger.info('APK download redirect');
  res.redirect(302, LATEST_APK_URL);
});

export default router;
