import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Base = sequelize.define("Base", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
});

export default Base;