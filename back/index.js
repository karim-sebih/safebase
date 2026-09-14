import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./src/routes/index.js";
import dotenv from "dotenv";

dotenv.config(); // Charger les variables d'environnement depuis le fichier .env



const app = express(); // Créer une application Express




// 2. CORS (très tôt)
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || origin.endsWith('.vercel.app') || origin === 'http://localhost:5173' || origin === 'http://localhost:3000' || origin === 'http://back:3000' || origin === "http://127.0.0.1:5173") {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    credentials: true,
}));

// 3. Parsing JSON → ABSOLUMENT AVANT LES ROUTES
app.use(express.json());          // ← pour req.body JSON
app.use(express.urlencoded({ extended: true }));  // ← si tu utilises forms aussi



const PORT = process.env.PORT || 3000; // Définir le port du serveur


// 5. Tes routes
app.use("/", router);

// Démarrer le serveur
app.listen(PORT, () => {
    console.log("-----------------------------");
    console.log("--        OUVERT        --");
    console.log("-----------------------------");

    console.log(`Le serveur est lancé sur http://localhost:${PORT}`);
});