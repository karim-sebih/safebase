import Backup from "./backupModel.js";
import Alert from "./alertsModel.js";

Backup.hasMany(Alert, {
    foreignKey: "backupId",
    onDelete: "SET NULL",
});

Alert.belongsTo(Backup, {
    foreignKey: "backupId",
});

export { Backup, Alert };