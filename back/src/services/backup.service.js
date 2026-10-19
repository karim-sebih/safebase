import { execFile } from '../utils/execFile.js';
import path from 'path';
import fs from 'fs';

export function backupDatabase() {
    return new Promise((resolve, reject) => {
        const filename = `${database.name}-${Date.now()}.sql`;
        const filepath = path.join(__dirname, '../../backups', filename);

        fs.mkdirSync("backups", { recursive: true });

        execFile('mysqldump', [
            '-h', database.host,
            `-P${database.port}`,
            `-u${database.user}`,
            database.name,
            `-p${database.password}`,
        ], (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            fs.writeFileSync(filepath, stdout);
            resolve(filepath);
        });
    });
}