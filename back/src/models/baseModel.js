import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Base = sequelize.define(
    "Base",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "Bases",
        timestamps: true,
    }
);

export default Base;