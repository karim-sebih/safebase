import sequelize from "../db/connection.js";

describe("Connexion à MySQL dans Docker", () => {
    afterAll(async () => {
        await sequelize.close();
    });

    test("le backend se connecte à la base", async () => {
        await expect(sequelize.authenticate()).resolves.toBeUndefined();
    });
});