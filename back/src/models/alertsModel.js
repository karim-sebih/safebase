import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Alert = sequelize.define(
    "Alert",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        baseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        backupId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: "Alerts",
        timestamps: false,
    }
);

export default Alert;