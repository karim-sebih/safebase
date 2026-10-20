import { Router } from "express";
import {
    listBackups,
    createBackup,
    updateStatus,
} from "../controllers/backup.controller.js";

const router = Router();

router.get("/bases/:baseId/backups", listBackups);
router.post("/bases/:baseId/backups", createBackup);
router.patch("/backups/:backupId/status", updateStatus);

export default router;