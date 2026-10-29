import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./src/routes/index.js";
import "./src/services/backup.cron.js";
const app = express();

app.use(cors({
    origin(origin, callback) {
        if (
            !origin ||
            origin.endsWith(".vercel.app") ||
            origin === "http://localhost:5173" ||
            origin === "http://localhost:3000" ||
            origin === "http://back:3000" ||
            origin === "http://127.0.0.1:5173"
        ) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "ngrok-skip-browser-warning"
    ],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Le serveur est lancé sur http://localhost:${PORT}`);
});