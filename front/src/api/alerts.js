import instance from "./config.js";

async function getAlerts(baseId) {
    const response = await instance.get(`/bases/${baseId}/alerts`);
    return response.data;
}

async function markAlertAsRead(alertId) {
    const response = await instance.patch(`/alerts/${alertId}/read`);
    return response.data;
}

async function deleteAlert(alertId) {
    const response = await instance.delete(`/alerts/${alertId}`);
    return response.data;
}

export {
    getAlerts,
    markAlertAsRead,
    deleteAlert,
};