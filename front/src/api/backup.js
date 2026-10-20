import instance from "./config.js";

async function getBackups(baseId) {
    const response = await instance.get(`/bases/${baseId}/backups`);
    return response.data;
}

async function createBackup(baseId, data = {}) {
    const response = await instance.post(`/bases/${baseId}/backups`, data);
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
    createBackup,
    updateBackupStatus,
};