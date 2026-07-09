import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stripeRouter from "./stripe";
import stripeConnectRouter from "./stripeConnect";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stripeRouter);
router.use(stripeConnectRouter);

export default router;
