import { Router } from "express";
import {
    listAlerts,
    markAlertAsRead,
    deleteAlert,
} from "../controllers/alert.controller.js";

const router = Router();

router.get("/bases/:baseId/alerts", listAlerts);
router.patch("/alerts/:alertId/read", markAlertAsRead);
router.delete("/alerts/:alertId", deleteAlert);

export default router;