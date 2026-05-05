import { Router, type IRouter } from "express";
import healthRouter from "./health";
import poiRouter from "./poi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(poiRouter);

export default router;
