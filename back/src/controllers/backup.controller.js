import Backup from "../models/backupModel.js";
import Alert from "../models/alertsModel.js";

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

export async function createBackup(req, res) {
    try {
        const { filename, filepath } = req.body;

        if (!filename || !filepath) {
            return res.status(400).json({
                message: "filename et filepath sont obligatoires.",
            });
        }

        const backup = await Backup.create({
            baseId: req.params.baseId,
            filename,
            filepath,
            status: "pending",
        });

        res.status(201).json(backup);
    } catch (error) {
        res.status(500).json({ message: error.message });
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