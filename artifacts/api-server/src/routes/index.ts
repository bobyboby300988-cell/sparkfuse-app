import { Router, type IRouter } from "express";
import healthRouter from "./health";
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

const router: IRouter = Router();

router.use(healthRouter);
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

export default router;
