import { createBackupFilename } from "../utils/backupFilename.js";

test("génère un nom de fichier avec le timestamp fourni", () => {
    const date = new Date(2026, 0, 1);

    expect(createBackupFilename(date)).toBe(
        `safebase-${date.getTime()}.sql`
    );
});

test("génère un fichier SQL", () => {
    expect(createBackupFilename(new Date(0))).toMatch(
        /^safebase-\d+\.sql$/
    );
});