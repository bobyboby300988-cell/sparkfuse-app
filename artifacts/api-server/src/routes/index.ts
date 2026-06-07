import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stripeRouter from "./stripe";
import paypalRouter from "./paypal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stripeRouter);
router.use(paypalRouter);

export default router;
