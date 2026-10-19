import instance from "./config.js";

async function createBase(data) {
    try {
        const response = await instance.post("/bases", data);
        return response.data;
    } catch (error) {
        console.error("ERREUR CREATE BASE :", error);
        throw error;
    }
}

async function getAllBases() {
    const response = await instance.get("/bases");
    return response.data;
}

async function getBaseById(id) {
    const response = await instance.get(`/bases/${id}`);
    return response.data;
}

async function updateBase(id, data) {
    const response = await instance.put(`/bases/${id}`, data);
    return response.data;
}

async function deleteBase(id) {
    const response = await instance.delete(`/bases/${id}`);
    return response.data;
}

export {
    createBase,
    getAllBases,
    getBaseById,
    updateBase,
    deleteBase,
};