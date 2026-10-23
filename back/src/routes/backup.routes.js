import { Router } from "express";
import {
    listBackups,
    createGlobalBackup,
    updateStatus,
} from "../controllers/backup.controller.js";

const router = Router();

router.get("/bases/:baseId/backups", listBackups);
router.post("/backups/global", createGlobalBackup);
router.patch("/backups/:backupId/status", updateStatus);

export default router;