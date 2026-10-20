import express from "express";
import baseRouter from "./base.route.js";
import backupRoutes from "./backup.routes.js";
import alertRoutes from "./alert.routes.js";


const router = express.Router();

router.use("/bases", baseRouter);
router.use(backupRoutes);
router.use(alertRoutes);

export default router;