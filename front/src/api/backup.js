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

async function getGlobalBackups() {
    const response = await instance.get("/backups/global");
    return response.data;
}

async function downloadBackup(backupId, filename = "sauvegarde.sql") {
    const response = await instance.get(`/backups/${backupId}/download`, {
        responseType: "blob",
    });

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
}

export {
    getBackups,
    createGlobalBackup,
    updateBackupStatus,
    getGlobalBackups,
    downloadBackup,
};