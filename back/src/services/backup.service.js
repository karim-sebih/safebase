// src/services/backup.service.js
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.resolve(currentDir, "../../backups");

export function backupDatabase() {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(backupDir, { recursive: true });

        const filename = `${process.env.DB_NAME}-${Date.now()}.sql`;
        const filepath = path.join(backupDir, filename);
        const output = fs.createWriteStream(filepath);

        const dump = spawn(
            "mysqldump",
            [
                "-h", process.env.DB_HOST,
                "-P", process.env.DB_PORT || "3306",
                "-u", process.env.DB_USER,
                process.env.DB_NAME,
            ],
            {
                // Évite de mettre le mot de passe directement dans les arguments.
                env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD },
            }
        );

        dump.stdout.pipe(output);

        dump.on("error", (error) => {
            output.destroy();
            reject(error);
        });

        dump.on("close", (code) => {
            if (code === 0) {
                resolve({ filename, filepath });
            } else {
                output.destroy();
                reject(new Error(`mysqldump a échoué (code ${code})`));
            }
        });
    });
}