import Alert from "../models/alertsModel.js";

export async function listAlerts(req, res) {
    try {
        const alerts = await Alert.findAll({
            where: { baseId: req.params.baseId },
            order: [["id", "DESC"]],
        });

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function markAlertAsRead(req, res) {
    try {
        const alert = await Alert.findByPk(req.params.alertId);

        if (!alert) {
            return res.status(404).json({ message: "Alerte introuvable." });
        }

        await alert.update({ isRead: true });
        res.json(alert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function deleteAlert(req, res) {
    try {
        const alert = await Alert.findByPk(req.params.alertId);

        if (!alert) {
            return res.status(404).json({ message: "Alerte introuvable." });
        }

        await alert.destroy();
        res.json({ message: "Alerte supprimée." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}