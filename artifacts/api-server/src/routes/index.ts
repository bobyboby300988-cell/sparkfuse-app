import { Router, type IRouter } from "express";
import healthRouter from "./health";
import downloadRouter from "./download";
import stripeRouter from "./stripe";
import stripeConnectRouter from "./stripeConnect";
import paypalRouter from "./paypal";
import liveRouter from "./live";
import authRouter from "./auth";
import storageRouter from "./storage";
import profileRouter from "./profile";
import matchingRouter from "./matching";
import blocksRouter from "./blocks";
import accountRouter from "./account";
import messagesRouter from "./messages";
import giftsRouter from "./gifts";
import coinsRouter from "./coins";
import callsRouter from "./calls";

const router: IRouter = Router();

router.use(healthRouter);
router.use(downloadRouter);
router.use(stripeRouter);
router.use(stripeConnectRouter);
router.use(paypalRouter);
router.use(liveRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(profileRouter);
router.use(matchingRouter);
router.use(blocksRouter);
router.use(accountRouter);
router.use(messagesRouter);
router.use(giftsRouter);
router.use(coinsRouter);
router.use(callsRouter);

export default router;
