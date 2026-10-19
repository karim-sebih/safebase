import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json',          // ← ajoute ça si absent
        'ngrok-skip-browser-warning': 'true'
    }
});
instance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem("token");

        if (token !== null) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        console.log("une erreur est survenue:", error);
        return Promise.reject(new Error(error));
    },
);

export default instance;