// src/cron/backup.cron.js
import cron from "node-cron";
import { backupDatabase } from "../services/backup.service.js";

cron.schedule("0 8 * * 1", async () => {
    try {
        const result = await backupDatabase();
        console.log("Sauvegarde créée :", result.filepath);
    } catch (error) {
        console.error("Échec de la sauvegarde :", error);
    }
});