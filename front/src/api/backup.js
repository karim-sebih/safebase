import instance from "./config.js";

async function getBackups(baseId) {
    const response = await instance.get(`/bases/${baseId}/backups`);
    return response.data;
}

async function createGlobalBackup() {
    const response = await instance.post("/backups/global");
    return response.data;
}

async function updateBackupStatus(backupId, data) {
    const response = await instance.patch(
        `/backups/${backupId}/status`,
        data
    );
    return response.data;
}

export {
    getBackups,
    createGlobalBackup,
    updateBackupStatus,
};