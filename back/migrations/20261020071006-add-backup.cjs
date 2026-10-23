"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          CREATE TABLE Backups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            baseId INT NULL,
            filename VARCHAR(255) NOT NULL,
            filepath VARCHAR(1024) NOT NULL,
            status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
            size BIGINT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT fk_backups_bases
              FOREIGN KEY (baseId) REFERENCES Bases(id)
              ON DELETE SET NULL
          )
        `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
          CREATE TABLE Alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            baseId INT NOT NULL,
            backupId INT NULL,
            type VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            isRead BOOLEAN NOT NULL DEFAULT FALSE,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT fk_alerts_bases
              FOREIGN KEY (baseId) REFERENCES Bases(id)
              ON DELETE CASCADE,

            CONSTRAINT fk_alerts_backups
              FOREIGN KEY (backupId) REFERENCES Backups(id)
              ON DELETE SET NULL
          )
        `,
        { transaction: t }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        "DROP TABLE IF EXISTS Alerts",
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        "DROP TABLE IF EXISTS Backups",
        { transaction: t }
      );
    });
  },
};