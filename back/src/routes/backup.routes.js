import { Router } from "express";
import {
    listBackups,
    createGlobalBackup,
    updateStatus,
    listGlobalBackups,
    downloadBackup,
} from "../controllers/backup.controller.js";

const router = Router();

router.get("/bases/:baseId/backups", listBackups);
router.post("/backups/global", createGlobalBackup);
router.patch("/backups/:backupId/status", updateStatus);
router.get("/backups/global", listGlobalBackups);
router.get("/backups/:backupId/download", downloadBackup);

export default router;