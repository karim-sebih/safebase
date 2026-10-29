// src/services/backup.cron.js
import cron from "node-cron";
import { backupDatabase } from "./backup.service.js";
import Backup from "../models/backupModel.js";

console.log("[CRON] Fichier backup.cron.js chargé");

cron.schedule("* * * * *", async () => {// ("* * * * *") toutes les 1 minutes, ("0 8 * * 1") tous les lundis à 8h
    console.log("[CRON] Déclenchement :", new Date().toLocaleString());

    try {
        const { filename, filepath } = await backupDatabase();

        const backup = await Backup.create({
            baseId: null, // sauvegarde globale
            filename,
            filepath,
            status: "success",
        });

        console.log("[CRON] Sauvegarde enregistrée :", backup.id, filepath);
    } catch (error) {
        console.error("[CRON] Échec de la sauvegarde :", error);
    }
});