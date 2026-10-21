import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Backup = sequelize.define(
    "Backup",
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
        filename: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        filepath: {
            type: DataTypes.STRING(1024),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("pending", "success", "failed"),
            allowNull: false,
            defaultValue: "pending",
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
    },
    {
        tableName: "Backups",
        timestamps: false,
    }
);

export default Backup;