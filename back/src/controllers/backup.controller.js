import Backup from "../models/backupModel.js";
import Alert from "../models/alertsModel.js";
import { backupDatabase } from "../services/backup.service.js";

export async function listBackups(req, res) {
    try {
        const backups = await Backup.findAll({
            where: { baseId: req.params.baseId },
            order: [["id", "DESC"]],
        });

        res.json(backups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function createGlobalBackup(req, res) {
    try {
        // Un seul dump pour toute l'application
        const { filename, filepath } = await backupDatabase();

        const backup = await Backup.create({
            baseId: null,
            filename,
            filepath,
            status: "success",
        });

        return res.status(201).json(backup);
    } catch (error) {
        console.error("Erreur pendant la sauvegarde globale :", error);

        return res.status(500).json({
            message: "La sauvegarde globale a échoué.",
            error: error.message,
        });
    }
}

export async function updateStatus(req, res) {
    try {
        const { status, size } = req.body;
        const allowedStatuses = ["pending", "success", "failed"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Statut invalide.",
                allowedStatuses,
            });
        }

        const backup = await Backup.findByPk(req.params.backupId);

        if (!backup) {
            return res.status(404).json({ message: "Sauvegarde introuvable." });
        }

        await backup.update({ status, size });

        if (status === "failed") {
            await Alert.create({
                baseId: backup.baseId,
                backupId: backup.id,
                type: "backup_failed",
                message: `Échec de la sauvegarde ${backup.filename}.`,
            });
        }

        res.json(backup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}