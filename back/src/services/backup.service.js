import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import createBackupFilename from "../utils/backupFilename.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.resolve(currentDir, "../../backups");

export async function backupDatabase() {
    fs.mkdirSync(backupDir, { recursive: true });


    const filename = createBackupFilename(process.env.DB_NAME);
    const filepath = path.join(backupDir, filename);
    const output = fs.createWriteStream(filepath);

    const dump = spawn(
        "mysqldump",
        [
            "--single-transaction",
            "--quick",
            "-h", process.env.DB_HOST,
            "-P", process.env.DB_PORT || "3306",
            "-u", process.env.DB_USER,
            process.env.DB_NAME,
        ],
        {
            env: {
                ...process.env,
                MYSQL_PWD: process.env.DB_PASSWORD,
            },
        }
    );

    let stderr = "";

    dump.stderr.setEncoding("utf8");
    dump.stderr.on("data", (chunk) => {
        stderr += chunk;
    });

    const processClosed = new Promise((resolve, reject) => {
        dump.once("error", reject);
        dump.once("close", (code, signal) => {
            resolve({ code, signal });
        });
    });

    try {
        const [, result] = await Promise.all([
            pipeline(dump.stdout, output),
            processClosed,
        ]);
        if (result.code !== 0) {
            throw new Error(
                `mysqldump a échoué (code ${result.code}) : ${stderr || `signal ${result.signal || "inconnu"}`
                }`
            );
        }

        console.log(`Sauvegarde créée : ${filepath}`);
        return { filename, filepath };
    } catch (error) {
        dump.kill();

        try {
            fs.unlinkSync(filepath);
        } catch {
            // Le fichier peut ne pas exister ou être déjà supprimé.
        }

        throw error;
    }
}